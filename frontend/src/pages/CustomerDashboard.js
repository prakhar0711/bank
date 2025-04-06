import React, { useState, useEffect } from "react";

const CustomerDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("deposit");

  // Get authentication token from localStorage
  const token = localStorage.getItem("token");

  // Get user info from localStorage
  const getUserInfo = () => {
    const userInfo = localStorage.getItem("user");
    return userInfo ? JSON.parse(userInfo) : null;
  };

  const userInfo = getUserInfo();
  const customerId = userInfo?.id;

  // Fetch customer accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!customerId || !token) {
        setError("User authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/customer/${customerId}/accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          setError("You don't have permission to access this resource.");
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch accounts");
        const data = await response.json();

        setAccounts(data);

        // Select the first account by default if available
        if (data.length > 0) {
          setSelectedAccount(data[0]);
          // Fetch transactions for the first account
          fetchTransactions(data[0].AccountNumber);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Error loading accounts. Please try again later.");
        console.error(err);
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [customerId, token]);

  // Fetch transactions for a specific account
  const fetchTransactions = async (accountNumber) => {
    if (!token) {
      setError("Authentication required.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/account/${accountNumber}/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();

      setTransactions(data);
      setLoading(false);
    } catch (err) {
      setError("Error loading transactions. Please try again later.");
      console.error(err);
      setLoading(false);
    }
  };

  // Handle account selection change
  const handleAccountChange = (e) => {
    const accountNumber = e.target.value;
    const account = accounts.find((acc) => acc.AccountNumber === accountNumber);
    setSelectedAccount(account);
    fetchTransactions(accountNumber);
  };

  // Handle transaction (deposit/withdraw)
  const handleTransaction = async (type) => {
    // Clear previous messages
    setError("");
    setSuccess("");

    if (!token) {
      setError("Authentication required.");
      return;
    }

    if (!selectedAccount) {
      setError("Please select an account first.");
      return;
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    // Validate withdrawal amount doesn't exceed balance
    if (type === "withdraw" && numAmount > selectedAccount.Balance) {
      setError("Insufficient funds for this withdrawal.");
      return;
    }

    try {
      // Note: For this to work, the user must have employee privileges
      // In a real app, you'd have a customer-specific endpoint
      const response = await fetch(`/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountNumber: selectedAccount.AccountNumber,
          amount: type === "withdraw" ? -numAmount : numAmount,
          transactionType: type === "withdraw" ? "Withdrawal" : "Deposit",
        }),
      });

      if (response.status === 403) {
        setError("You don't have permission to perform this transaction.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transaction failed");
      }

      // Update account balance locally
      setSelectedAccount({
        ...selectedAccount,
        Balance:
          type === "deposit"
            ? selectedAccount.Balance + numAmount
            : selectedAccount.Balance - numAmount,
      });

      // Update the accounts array
      setAccounts(
        accounts.map((acc) =>
          acc.AccountNumber === selectedAccount.AccountNumber
            ? {
                ...acc,
                Balance:
                  type === "deposit"
                    ? acc.Balance + numAmount
                    : acc.Balance - numAmount,
              }
            : acc
        )
      );

      // Refresh transactions
      fetchTransactions(selectedAccount.AccountNumber);

      setSuccess(
        `${type === "deposit" ? "Deposit" : "Withdrawal"} successful!`
      );
      setAmount("");
    } catch (err) {
      setError(err.message || `Failed to process ${type}. Please try again.`);
      console.error(err);
    }
  };

  if (loading && accounts.length === 0)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Loading account information...
      </div>
    );

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      {/* Authentication Error */}
      {(!customerId || !token) && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            color: "#c62828",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontWeight: "bold" }}>⚠️</span>
          You are not logged in or your session has expired. Please log in
          again.
        </div>
      )}

      {/* Account Selection */}
      {accounts.length > 0 && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ marginTop: "0", marginBottom: "1rem" }}>
            Select Account
          </h2>
          <select
            value={selectedAccount?.AccountNumber || ""}
            onChange={handleAccountChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">Select an Account</option>
            {accounts.map((account) => (
              <option key={account.AccountNumber} value={account.AccountNumber}>
                {account.AccountType} - {account.AccountNumber} - $
                {parseFloat(account.Balance).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Account Summary Card */}
      {selectedAccount && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ marginTop: "0", marginBottom: "1rem" }}>
            Account Summary
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#666", margin: "0" }}>
                Account Number
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  margin: "0.25rem 0",
                }}
              >
                {selectedAccount.AccountNumber}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#666", margin: "0" }}>
                Account Type
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  margin: "0.25rem 0",
                }}
              >
                {selectedAccount.AccountType}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#666", margin: "0" }}>
                Current Balance
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  margin: "0.25rem 0",
                }}
              >
                ${parseFloat(selectedAccount.Balance).toFixed(2)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", color: "#666", margin: "0" }}>
                Branch
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  margin: "0.25rem 0",
                }}
              >
                {selectedAccount.BranchName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Tabs */}
      {selectedAccount && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0" }}>
            <button
              onClick={() => setActiveTab("deposit")}
              style={{
                padding: "0.75rem 1rem",
                flex: "1",
                border: "none",
                background: activeTab === "deposit" ? "#f0f0f0" : "transparent",
                borderBottom:
                  activeTab === "deposit" ? "2px solid #0066cc" : "none",
                cursor: "pointer",
                fontWeight: activeTab === "deposit" ? "bold" : "normal",
              }}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              style={{
                padding: "0.75rem 1rem",
                flex: "1",
                border: "none",
                background:
                  activeTab === "withdraw" ? "#f0f0f0" : "transparent",
                borderBottom:
                  activeTab === "withdraw" ? "2px solid #0066cc" : "none",
                cursor: "pointer",
                fontWeight: activeTab === "withdraw" ? "bold" : "normal",
              }}
            >
              Withdraw
            </button>
          </div>

          {/* Deposit Tab Content */}
          {activeTab === "deposit" && (
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: "1rem",
                backgroundColor: "#fff",
              }}
            >
              <h3 style={{ marginTop: "0" }}>Make a Deposit</h3>
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
              >
                <div style={{ flex: "1" }}>
                  <label
                    htmlFor="deposit-amount"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Amount ($)
                  </label>
                  <input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <button
                  onClick={() => handleTransaction("deposit")}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Deposit Funds
                </button>
              </div>
            </div>
          )}

          {/* Withdraw Tab Content */}
          {activeTab === "withdraw" && (
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: "1rem",
                backgroundColor: "#fff",
              }}
            >
              <h3 style={{ marginTop: "0" }}>Make a Withdrawal</h3>
              <div
                style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
              >
                <div style={{ flex: "1" }}>
                  <label
                    htmlFor="withdraw-amount"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Amount ($)
                  </label>
                  <input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    max={selectedAccount?.Balance || 0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <button
                  onClick={() => handleTransaction("withdraw")}
                  disabled={
                    !selectedAccount || parseFloat(selectedAccount.Balance) <= 0
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor:
                      !selectedAccount ||
                      parseFloat(selectedAccount.Balance) <= 0
                        ? "#cccccc"
                        : "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      !selectedAccount ||
                      parseFloat(selectedAccount.Balance) <= 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Withdraw Funds
                </button>
              </div>
              {selectedAccount && parseFloat(selectedAccount.Balance) <= 0 && (
                <p
                  style={{
                    color: "#cc0000",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  You have insufficient funds for withdrawal.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            color: "#c62828",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontWeight: "bold" }}>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#e8f5e9",
            border: "1px solid #c8e6c9",
            color: "#2e7d32",
            padding: "0.75rem",
            borderRadius: "4px",
            marginBottom: "1.5rem",
          }}
        >
          {success}
        </div>
      )}

      {/* Transaction History */}
      {selectedAccount && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#fff",
          }}
        >
          <h2 style={{ marginTop: "0", marginBottom: "1rem" }}>
            Transaction History
          </h2>

          {loading ? (
            <p
              style={{ textAlign: "center", color: "#666", padding: "1rem 0" }}
            >
              Loading transactions...
            </p>
          ) : transactions.length === 0 ? (
            <p
              style={{ textAlign: "center", color: "#666", padding: "1rem 0" }}
            >
              No transaction history available.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      Date
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      Type
                    </th>
                    <th style={{ textAlign: "left", padding: "0.75rem" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    // Format the display values based on the transaction type
                    const isDeposit = tx.TransactionType === "Deposit";
                    const displayAmount = `$${Math.abs(
                      parseFloat(tx.Amount)
                    ).toFixed(2)}`;
                    const amountColor = isDeposit ? "#2e7d32" : "#c62828";

                    return (
                      <tr
                        key={tx.TransactionID}
                        style={{ borderBottom: "1px solid #e0e0e0" }}
                      >
                        <td style={{ padding: "0.75rem" }}>
                          {new Date(tx.DateTime).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {tx.TransactionType}
                        </td>
                        <td style={{ padding: "0.75rem", color: amountColor }}>
                          {isDeposit ? "+" : "-"}
                          {displayAmount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
