import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionForm, setTransactionForm] = useState({
    accountNumber: "",
    amount: "",
    transactionType: "Deposit",
  });
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("customers");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch customers
        const customersResponse = await axios.get("/api/customers", {
          headers,
        });
        setCustomers(customersResponse.data);

        // Fetch loans
        const loansResponse = await axios.get("/api/loans", { headers });
        setLoans(loansResponse.data);

        // Fetch audit logs
        const auditResponse = await axios.get("/api/audit-logs", { headers });
        setAuditLogs(auditResponse.data);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm({
      ...transactionForm,
      [name]: value,
    });
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        "/api/transactions",
        {
          accountNumber: transactionForm.accountNumber,
          amount: parseFloat(transactionForm.amount),
          transactionType: transactionForm.transactionType,
        },
        { headers }
      );

      setMessage(
        `Transaction successful! Transaction ID: ${response.data.transactionId}`
      );
      setTransactionForm({
        accountNumber: "",
        amount: "",
        transactionType: "Deposit",
      });

      // Log this action in audit logs
      await axios.post(
        "/api/audit-logs",
        {
          actionPerformed: `Processed ${transactionForm.transactionType} of $${transactionForm.amount} for account ${transactionForm.accountNumber}`,
        },
        { headers }
      );

      // Refresh audit logs
      const auditResponse = await axios.get("/api/audit-logs", { headers });
      setAuditLogs(auditResponse.data);
    } catch (err) {
      setMessage(
        `Error: ${err.response?.data?.message || "Transaction failed"}`
      );
    }
  };

  const handleApproveLoan = async (loanId, approved) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(
        `/api/loans/${loanId}`,
        {
          status: approved ? "Approved" : "Rejected",
        },
        { headers }
      );

      // Log this action in audit logs
      await axios.post(
        "/api/audit-logs",
        {
          actionPerformed: `${
            approved ? "Approved" : "Rejected"
          } loan application #${loanId}`,
        },
        { headers }
      );

      // Refresh loans
      const loansResponse = await axios.get("/api/loans", { headers });
      setLoans(loansResponse.data);

      // Refresh audit logs
      const auditResponse = await axios.get("/api/audit-logs", { headers });
      setAuditLogs(auditResponse.data);

      setMessage(
        `Loan #${loanId} was ${approved ? "approved" : "rejected"} successfully`
      );
    } catch (err) {
      setMessage(
        `Error: ${err.response?.data?.message || "Failed to process loan"}`
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Employee Dashboard</h1>
      <p>Welcome, {user.Name}</p>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "customers" ? "active" : ""}`}
          onClick={() => setActiveTab("customers")}
        >
          Customers
        </button>
        <button
          className={`tab ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          Process Transaction
        </button>
        <button
          className={`tab ${activeTab === "loans" ? "active" : ""}`}
          onClick={() => setActiveTab("loans")}
        >
          Loan Applications
        </button>
        <button
          className={`tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Logs
        </button>
      </div>

      {message && (
        <div
          className={
            message.includes("Error") ? "error-message" : "success-message"
          }
        >
          {message}
        </div>
      )}

      {/* Transaction Form */}
      {activeTab === "transactions" && (
        <div className="card">
          <h2>Process Transaction</h2>
          <form onSubmit={handleTransactionSubmit}>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                className="form-control"
                name="accountNumber"
                value={transactionForm.accountNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select
                className="form-control"
                name="transactionType"
                value={transactionForm.transactionType}
                onChange={handleInputChange}
              >
                <option value="Deposit">Deposit</option>
                <option value="Withdrawal">Withdrawal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={transactionForm.amount}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Process Transaction
            </button>
          </form>
        </div>
      )}

      {/* Customer List */}
      {activeTab === "customers" && (
        <div className="card">
          <h2>Customer List</h2>
          {customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.CustomerID}>
                    <td>{customer.CustomerID}</td>
                    <td>{customer.Name}</td>
                    <td>{customer.Email}</td>
                    <td>{customer.PhoneNumber}</td>
                    <td>
                      <Link
                        to={`/customer/details/${customer.Name}`}
                        className="btn btn-primary"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Loan Applications */}
      {activeTab === "loans" && (
        <div className="card">
          <h2>Loan Applications</h2>
          {loans.length === 0 ? (
            <p>No loan applications found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.LoanID}>
                    <td>{loan.LoanID}</td>
                    <td>{loan.CustomerName}</td>
                    <td>{loan.LoanType}</td>
                    <td>${parseFloat(loan.Amount).toFixed(2)}</td>
                    <td>{loan.InterestRate}%</td>
                    <td>{loan.DurationMonths} months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === "audit" && (
        <div className="card">
          <h2>Audit Logs</h2>
          {auditLogs.length === 0 ? (
            <p>No audit logs found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Employee</th>
                  <th>Action</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.LogID}>
                    <td>{log.LogID}</td>
                    <td>{log.EmployeeName}</td>
                    <td>{log.ActionPerformed}</td>
                    <td>{new Date(log.DateTime).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
