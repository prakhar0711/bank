const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');


const auth = require('../middleware/auth');

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
const db = pool;
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

// Deposit funds
router.post('/deposit', [
  authenticateToken,
  body('account_id').isInt(),
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { account_id, amount, description } = req.body;
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

    // Verify account ownership
    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND customer_id = ?',
      [account_id, customerId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accounts[0];

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update account balance
      await connection.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [amount, account_id]
      );

      // Create transaction record
      const [transactionResult] = await connection.execute(
        'INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
        [account_id, 'deposit', amount, description || 'Deposit']
      );

      await connection.commit();

      res.json({
        message: 'Deposit successful',
        transaction: {
          id: transactionResult.insertId,
          account_id,
          type: 'deposit',
          amount,
          description: description || 'Deposit'
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

// Withdraw funds
router.post('/withdraw', [
  authenticateToken,
  body('account_id').isInt(),
  body('amount').isFloat({ min: 0.01 }),
  body('description').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { account_id, amount, description } = req.body;
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

    // Verify account ownership and sufficient funds
    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND customer_id = ?',
      [account_id, customerId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const account = accounts[0];

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update account balance
      await connection.execute(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [amount, account_id]
      );

      // Create transaction record
      const [transactionResult] = await connection.execute(
        'INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
        [account_id, 'withdrawal', amount, description || 'Withdrawal']
      );

      await connection.commit();

      res.json({
        message: 'Withdrawal successful',
        transaction: {
          id: transactionResult.insertId,
          account_id,
          type: 'withdrawal',
          amount,
          description: description || 'Withdrawal'
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

// Get transaction history
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const accountId = req.params.accountId;
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

    // Verify account ownership
    const [accounts] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND customer_id = ?',
      [accountId, customerId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get transactions
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
      [accountId]
    );

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer funds between accounts
router.post('/transfer', [
  authenticateToken,
  body('account_id').isInt(),
  body('amount').isFloat({ min: 0.01 }),
  body('target_account_number').notEmpty().trim(),
  body('description').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { account_id, amount, target_account_number, description } = req.body;
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

    // Verify source account ownership and sufficient funds
    const [sourceAccounts] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND customer_id = ?',
      [account_id, customerId]
    );

    if (sourceAccounts.length === 0) {
      return res.status(404).json({ message: 'Source account not found' });
    }

    const sourceAccount = sourceAccounts[0];

    if (sourceAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Find target account
    const [targetAccounts] = await pool.execute(
      'SELECT * FROM accounts WHERE account_number = ?',
      [target_account_number]
    );

    if (targetAccounts.length === 0) {
      return res.status(404).json({ message: 'Target account not found' });
    }

    const targetAccount = targetAccounts[0];

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update source account balance
      await connection.execute(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?',
        [amount, account_id]
      );

      // Update target account balance
      await connection.execute(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [amount, targetAccount.id]
      );

      // Create transaction records
      const [sourceTransactionResult] = await connection.execute(
        'INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
        [account_id, 'transfer', amount, description || `Transfer to ${target_account_number}`]
      );

      const [targetTransactionResult] = await connection.execute(
        'INSERT INTO transactions (account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?)',
        [targetAccount.id, 'transfer', amount, description || `Transfer from ${sourceAccount.account_number}`]
      );

      await connection.commit();

      res.json({
        message: 'Transfer successful',
        transaction: {
          id: sourceTransactionResult.insertId,
          account_id,
          type: 'transfer',
          amount,
          description: description || `Transfer to ${target_account_number}`
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

// Get all transactions for a specific customer
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // First verify the customer exists and belongs to the employee's branch
    const customerQuery = `
      SELECT c.*
      FROM customers c
      JOIN accounts a ON c.id = a.customer_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const [customerResult] = await pool.query(customerQuery, [customerId]);
    
    if (customerResult.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // If the user is not an admin, verify they have access to the customer's branch
    if (req.user.role !== 'admin') {
      if (customerResult[0].branch_id !== req.user.branch_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get all transactions for the customer
    const transactionsQuery = `
      SELECT 
        t.*,
        a.account_type,
        a.account_number,
        CASE 
          WHEN t.transaction_type = 'deposit' THEN t.amount
          ELSE -t.amount
        END as signed_amount
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE a.customer_id = ?
      ORDER BY t.created_at DESC
    `;
    
    const [transactionsResult] = await pool.query(transactionsQuery, [customerId]);
    
    res.json(transactionsResult);
  } catch (error) {
    console.error('Error fetching customer transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 