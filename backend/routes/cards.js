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

// Get all cards for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Check if user is admin or the customer themselves
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(customerId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [cards] = await pool.execute(`
      SELECT c.*, a.AccountType, a.Balance
      FROM Cards c
      JOIN Account a ON c.AccountNumber = a.AccountNumber
      WHERE c.CustomerID = ?
    `, [customerId]);

    res.json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get card by number
router.get('/:cardNumber', authenticateToken, async (req, res) => {
  try {
    const cardNumber = req.params.cardNumber;

    const [cards] = await pool.execute(`
      SELECT c.*, a.AccountType, a.Balance, cu.Name as CustomerName
      FROM Cards c
      JOIN Account a ON c.AccountNumber = a.AccountNumber
      JOIN Customer cu ON c.CustomerID = cu.CustomerID
      WHERE c.CardNumber = ?
    `, [cardNumber]);

    if (cards.length === 0) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if user is admin or the card owner
    if (req.user.role !== 'admin' && req.user.userId !== cards[0].CustomerID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(cards[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new card
router.post('/', [
  authenticateToken,
  body('accountNumber').notEmpty().trim(),
  body('cardType').isIn(['credit', 'debit', 'prepaid']),
  body('expiryDate').isDate(),
  body('cvv').isLength({ min: 3, max: 4 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountNumber, cardType, expiryDate, cvv } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if account exists and belongs to the customer
      const [accounts] = await connection.execute(
        'SELECT CustomerID FROM Account WHERE AccountNumber = ?',
        [accountNumber]
      );

      if (accounts.length === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Check if user is admin or the account owner
      if (req.user.role !== 'admin' && req.user.userId !== accounts[0].CustomerID) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Generate card number (simple implementation)
      const cardNumber = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();

      // Create card
      const [cardResult] = await connection.execute(
        'INSERT INTO Cards (CardNumber, AccountNumber, CardType, ExpiryDate, CVV, CustomerID) VALUES (?, ?, ?, ?, ?, ?)',
        [cardNumber, accountNumber, cardType, expiryDate, cvv, accounts[0].CustomerID]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Card created successfully',
        card: {
          cardNumber,
          accountNumber,
          cardType,
          expiryDate
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

// Update card
router.put('/:cardNumber', authenticateToken, async (req, res) => {
  try {
    const cardNumber = req.params.cardNumber;
    const { expiryDate, cvv } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if card exists
      const [cards] = await connection.execute(
        'SELECT CustomerID FROM Cards WHERE CardNumber = ?',
        [cardNumber]
      );

      if (cards.length === 0) {
        return res.status(404).json({ message: 'Card not found' });
      }

      // Check if user is admin or the card owner
      if (req.user.role !== 'admin' && req.user.userId !== cards[0].CustomerID) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Update card
      await connection.execute(
        'UPDATE Cards SET ExpiryDate = ?, CVV = ? WHERE CardNumber = ?',
        [expiryDate, cvv, cardNumber]
      );

      await connection.commit();

      res.json({ message: 'Card updated successfully' });
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

// Delete card
router.delete('/:cardNumber', authenticateToken, async (req, res) => {
  try {
    const cardNumber = req.params.cardNumber;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if card exists
      const [cards] = await connection.execute(
        'SELECT CustomerID FROM Cards WHERE CardNumber = ?',
        [cardNumber]
      );

      if (cards.length === 0) {
        return res.status(404).json({ message: 'Card not found' });
      }

      // Check if user is admin or the card owner
      if (req.user.role !== 'admin' && req.user.userId !== cards[0].CustomerID) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete card
      await connection.execute(
        'DELETE FROM Cards WHERE CardNumber = ?',
        [cardNumber]
      );

      await connection.commit();

      res.json({ message: 'Card deleted successfully' });
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

module.exports = router; 