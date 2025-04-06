// src/pages/AccountDetails.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AccountDetails = () => {
  const { accountNumber } = useParams();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferForm, setTransferForm] = useState({
    toAccount: "",
    amount: "",
    description: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch account details
        const accountRes = await axios.get(`/api/accounts/${accountNumber}`, {
          headers,
        });
        setAccount(accountRes.data);

        // Fetch transactions
        const transactionsRes = await axios.get(
          `/api/accounts/${accountNumber}/transactions`,
          { headers }
        );
        setTransactions(transactionsRes.data);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [accountNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferForm({
      ...transferForm,
      [name]: value,
    });
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        "/api/transfers",
        {
          fromAccount: accountNumber,
          toAccount: transferForm.toAccount,
          amount: parseFloat(transferForm.amount),
          description: transferForm.description,
        },
        { headers }
      );

      setMessage(
        `Transfer successful! Transaction ID: ${response.data.transactionId}`
      );
      setTransferForm({
        toAccount: "",
        amount: "",
        description: "",
      });

      // Refresh account data
      const accountRes = await axios.get(`/api/accounts/${accountNumber}`, {
        headers,
      });
      setAccount(accountRes.data);

      // Refresh transactions
      const transactionsRes = await axios.get(
        `/api/accounts/${accountNumber}/transactions`,
        { headers }
      );
      setTransactions(transactionsRes.data);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || "Transfer failed"}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div>
      <h1>Account Details</h1>

      <div className="card">
        <h2>Account Information</h2>
        <p>
          <strong>Account Number:</strong> {account.AccountNumber}
        </p>
        <p>
          <strong>Account Type:</strong> {account.AccountType}
        </p>
        <p>
          <strong>Current Balance:</strong> ${account.Balance.toFixed(2)}
        </p>
        <p>
          <strong>Branch:</strong> {account.BranchName}
        </p>
        <p>
          <strong>Opened:</strong>{" "}
          {new Date(account.OpenDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Status:</strong> {account.Status}
        </p>
      </div>

      <div className="card">
        <h2>Transfer Money</h2>
        {message && (
          <div
            className={
              message.includes("Error") ? "error-message" : "success-message"
            }
          >
            {message}
          </div>
        )}

        <form onSubmit={handleTransferSubmit}>
          <div className="form-group">
            <label className="form-label">To Account</label>
            <input
              type="text"
              className="form-control"
              name="toAccount"
              value={transferForm.toAccount}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control"
              name="amount"
              value={transferForm.amount}
              onChange={handleInputChange}
              min="0.01"
              step="0.01"
              max={account.Balance}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              name="description"
              value={transferForm.description}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Send Transfer
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.TransactionID}>
                  <td>
                    {new Date(transaction.TransactionDate).toLocaleDateString()}
                  </td>
                  <td>{transaction.Description}</td>
                  <td
                    className={
                      transaction.TransactionType === "Deposit" ||
                      transaction.TransactionType === "Transfer In"
                        ? "positive-amount"
                        : "negative-amount"
                    }
                  >
                    ${transaction.Amount.toFixed(2)}
                  </td>
                  <td>{transaction.TransactionType}</td>
                  <td>${transaction.BalanceAfter.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AccountDetails;
