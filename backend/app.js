// app.js - Express server for Banking System

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin", // Replace with your MySQL password
  database: "Bank",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// JWT Secret
const JWT_SECRET = "banking-system-secret-key"; // Use environment variables for this in production

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Routes

// Login route for customers
app.post("/api/login/customer", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT CustomerID, Name, Email, Password FROM Customer WHERE Email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const customer = rows[0];

    // In a real app, you would use bcrypt.compare()
    // For demo purposes, we're comparing directly
    if (password !== customer.Password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      { id: customer.CustomerID, name: customer.Name, role: "customer" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        id: customer.CustomerID,
        name: customer.Name,
        role: "customer",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login route for employees
app.post("/api/login/employee", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT e.EmployeeID, e.Name, e.Email, e.Password, r.RoleName 
       FROM Employee e
       JOIN Role r ON e.RoleID = r.RoleID
       WHERE e.Email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const employee = rows[0];

    // In a real app, use bcrypt.compare()
    if (password !== employee.Password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      { id: employee.EmployeeID, name: employee.Name, role: employee.RoleName },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        id: employee.EmployeeID,
        name: employee.Name,
        role: employee.RoleName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get customer profile
app.get("/api/customer/profile/:id", authenticateToken, async (req, res) => {
  try {
    // Check if the user is accessing their own profile
    if (req.user.role !== "Employee" && req.user.id != req.params.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT c.CustomerID, c.Name, c.DateOfBirth, c.PhoneNumber, c.Email,
              a.Street, a.City, a.State, a.ZipCode, a.Country
       FROM Customer c
       LEFT JOIN Address a ON c.AddressID = a.AddressID
       WHERE c.CustomerID = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get customer accounts
app.get("/api/customer/:id/accounts", authenticateToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== "Employee" && req.user.id != req.params.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT a.AccountNumber, a.AccountType, a.Balance, a.DateCreated,
              b.BranchName
       FROM Account a
       JOIN Branch b ON a.BranchID = b.BranchID
       WHERE a.CustomerID = ?`,
      [req.params.id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/customer/:id", authenticateToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== "Employee" && req.user.id != req.params.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT Name, DateOfBirth, PhoneNumber, Email,
              AddressID
       FROM Customer 
       WHERE Name = ?`,
      [req.params.name]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get account transactions
app.get(
  "/api/account/:accountNumber/transactions",
  authenticateToken,
  async (req, res) => {
    try {
      // First check if the user is authorized to view this account
      const [accounts] = await pool.query(
        "SELECT CustomerID FROM Account WHERE AccountNumber = ?",
        [req.params.accountNumber]
      );

      if (accounts.length === 0) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (
        req.user.role !== "Employee" &&
        req.user.id != accounts[0].CustomerID
      ) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const [rows] = await pool.query(
        `SELECT TransactionID, Amount, TransactionType, DateTime
       FROM Transaction
       WHERE AccountNumber = ?
       ORDER BY DateTime DESC`,
        [req.params.accountNumber]
      );

      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get customer loans
app.get("/api/customer/:id/loans", authenticateToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== "Employee" && req.user.id != req.params.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT LoanID, LoanType, Amount, InterestRate, DurationMonths
       FROM Loan
       WHERE CustomerID = ?`,
      [req.params.id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get customer cards
app.get("/api/customer/:id/cards", authenticateToken, async (req, res) => {
  try {
    // First get all accounts for the customer
    const [accounts] = await pool.query(
      "SELECT AccountNumber FROM Account WHERE CustomerID = ?",
      [req.params.id]
    );

    if (accounts.length === 0) {
      return res.status(200).json([]);
    }

    // Check authorization
    if (req.user.role !== "Employee" && req.user.id != req.params.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Get cards for all accounts
    const accountNumbers = accounts.map((acc) => acc.AccountNumber);
    const placeholders = accountNumbers.map(() => "?").join(",");

    const [rows] = await pool.query(
      `SELECT c.CardNumber, c.AccountNumber, c.CardType, c.ExpiryDate,
              CONCAT('****-****-****-', RIGHT(c.CardNumber, 4)) AS MaskedCardNumber
       FROM Cards c
       WHERE c.AccountNumber IN (${placeholders})`,
      accountNumbers
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// For employees: Get all customers
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT c.CustomerID, c.Name, c.Email, c.PhoneNumber,
              a.City, a.State, a.Country
       FROM Customer c
       LEFT JOIN Address a ON c.AddressID = a.AddressID`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// For employees: Get all loans
app.get("/api/loans", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT l.LoanID, l.LoanType, l.Amount, l.InterestRate, l.DurationMonths, 
              c.Name as CustomerName, c.CustomerID
       FROM Loan l
       JOIN Customer c ON l.CustomerID = c.CustomerID
       ORDER BY l.LoanID DESC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// For employees: Update loan status (approve/reject)
app.put("/api/loans/:id", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { status } = req.body;
    const loanId = req.params.id;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update the loan status
      await connection.query("UPDATE Loan SET Status = ? WHERE LoanID = ?", [
        status,
        loanId,
      ]);

      // Log the action
      await connection.query(
        "INSERT INTO AuditLog (EmployeeID, ActionPerformed, DateTime) VALUES (?, ?, NOW())",
        [req.user.id, `${status} loan application #${loanId}`]
      );

      await connection.commit();
      res.status(200).json({ message: "Loan status updated successfully" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// For employees: Get loan details
app.get("/api/loans/:id", authenticateToken, async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== "Employee" && req.user.role !== "customer") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT l.LoanID, l.LoanType, l.Amount, l.InterestRate, l.DurationMonths, 
               l.DateApplied, c.Name as CustomerName, c.CustomerID
       FROM Loan l
       JOIN Customer c ON l.CustomerID = c.CustomerID
       WHERE l.LoanID = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // If customer is accessing, ensure they can only see their own loans
    if (req.user.role === "customer" && req.user.id != rows[0].CustomerID) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// For employees: Get audit logs
app.get("/api/audit-logs", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const [rows] = await pool.query(
      `SELECT a.LogID, a.ActionPerformed, a.DateTime, e.Name as EmployeeName
       FROM AuditLog a
       JOIN Employee e ON a.EmployeeID = e.EmployeeID
       ORDER BY a.DateTime DESC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// For employees: Create audit log entry
app.post("/api/audit-logs", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    if (req.user.role !== "Employee") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { actionPerformed } = req.body;

    await pool.query(
      "INSERT INTO AuditLog (EmployeeID, ActionPerformed, DateTime) VALUES (?, ?, NOW())",
      [req.user.id, actionPerformed]
    );

    res.status(201).json({ message: "Audit log created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// For employees: Create transaction
app.post("/api/transactions", authenticateToken, async (req, res) => {
  try {
    // Only employees can access this endpoint
    // if (req.user.role !== "Employee") {
    //   return res.status(403).json({ message: "Unauthorized access" });
    // }

    const { accountNumber, amount, transactionType } = req.body;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create the transaction
      await connection.query(
        "INSERT INTO Transaction (AccountNumber, Amount, TransactionType, DateTime) VALUES (?, ?, ?, NOW())",
        [accountNumber, amount, transactionType]
      );

      // Update account balance
      await connection.query(
        "UPDATE Account SET Balance = Balance + ? WHERE AccountNumber = ?",
        [amount, accountNumber]
      );

      // Log the action
      await connection.query(
        "INSERT INTO AuditLog (EmployeeID, ActionPerformed, DateTime) VALUES (?, ?, NOW())",
        [
          req.user.id,
          `${transactionType} transaction of ${amount} for account ${accountNumber}`,
        ]
      );

      await connection.commit();
      res.status(201).json({ message: "Transaction created successfully" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/customer", authenticateToken, async (req, res) => {
  try {
    const { name } = req.query;
    let query = "SELECT * FROM Customer";
    let params = [];

    // If name parameter is provided, filter by name
    if (name) {
      query += " WHERE Name LIKE ?";
      params.push(`%${name}%`); // Using LIKE for partial matches
    }

    const [rows] = await pool.execute(query, params);

    // If looking for a specific name and exact match is preferred
    if (name && name.trim() !== "") {
      const exactMatch = rows.find(
        (customer) => customer.Name.toLowerCase() === name.toLowerCase()
      );

      if (exactMatch) {
        return res.json([exactMatch]);
      }
    }

    return res.json(rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
