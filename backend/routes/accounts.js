const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Create new account
router.post('/', [
  authenticateToken,
  body('account_type').isIn(['savings', 'checking']),
  body('initial_deposit').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { account_type, initial_deposit } = req.body;
    const userId = req.user.userId;

    // Get customer_id from user_id
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [userId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const customerId = customers[0].id;

    // Generate account number (simple implementation)
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create account
      const [accountResult] = await connection.execute(
        'INSERT INTO accounts (customer_id, account_number, balance, account_type) VALUES (?, ?, ?, ?)',
        [customerId, accountNumber, initial_deposit, account_type]
      );

      // If initial deposit is provided, create a transaction record
      if (initial_deposit > 0) {
        await connection.execute(
          'INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
          [accountResult.insertId, 'deposit', initial_deposit, 'Initial deposit']
        );
      }

      await connection.commit();

      res.status(201).json({
        message: 'Account created successfully',
        account: {
          id: accountResult.insertId,
          account_number: accountNumber,
          balance: initial_deposit,
          account_type
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.user.userId;

    // Get customer_id from user_id
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [userId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const customerId = customers[0].id;

    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND customer_id = ?',
      [accountId, customerId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json(accounts[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all accounts for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get customer_id from user_id
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE user_id = ?',
      [userId]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    const customerId = customers[0].id;

    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE customer_id = ?',
      [customerId]
    );

    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account by account number
router.get('/by-number/:accountNumber', authenticateToken, async (req, res) => {
  try {
    const accountNumber = req.params.accountNumber;

    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE account_number = ?',
      [accountNumber]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // For security, only return basic account info
    const account = accounts[0];
    res.json({
      id: account.id,
      account_number: account.account_number,
      account_type: account.account_type,
      balance: account.balance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 