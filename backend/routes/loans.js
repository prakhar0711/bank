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

// Get all loans (for admin/employee) or customer's loans
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'customer') {
      query = `
        SELECT l.*, 
               c.first_name, c.last_name, c.email, c.phone, c.address,
               lp.name as product_name, lp.description as product_description
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        JOIN loan_products lp ON l.loan_product_id = lp.id
        WHERE c.user_id = ?
        ORDER BY l.created_at DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT l.*, 
               c.first_name, c.last_name, c.email, c.phone, c.address,
               lp.name as product_name, lp.description as product_description
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        JOIN loan_products lp ON l.loan_product_id = lp.id
        ORDER BY l.created_at DESC
      `;
    }

    const [loans] = await pool.query(query, params);
    
    // Format the response
    const formattedLoans = loans.map(loan => ({
      ...loan,
      customer: {
        id: loan.customer_id,
        first_name: loan.first_name,
        last_name: loan.last_name,
        email: loan.email,
        phone: loan.phone,
        address: loan.address
      },
      product: {
        id: loan.loan_product_id,
        name: loan.product_name,
        description: loan.product_description
      }
    }));

    res.json(formattedLoans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ message: 'Error fetching loans' });
  }
});

// Get all loans for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Check if user is admin or the customer themselves
    if (req.user.role !== 'admin' && req.user.userId !== parseInt(customerId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [loans] = await pool.execute(`
      SELECT l.*
      FROM loans l
      WHERE l.customer_id = ?
    `, [customerId]);

    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get loan by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.id;

    const [loans] = await pool.execute(`
      SELECT l.*
      FROM loans l
      WHERE l.id = ?
    `, [loanId]);

    if (loans.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if user is admin or the loan owner
    if (req.user.role !== 'admin' && req.user.userId !== loans[0].customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(loans[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new loan
router.post('/', [
  authenticateToken,
  body('customerId').isInt(),
  body('loanType').isIn(['personal', 'home', 'car', 'business']),
  body('amount').isFloat({ min: 0 }),
  body('interestRate').isFloat({ min: 0 }),
  body('duration').isInt({ min: 1 }),
  body('monthlyPayment').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, loanType, amount, interestRate, duration, monthlyPayment } = req.body;

    // Check if user is admin or the customer themselves
    if (req.user.role !== 'admin' && req.user.userId !== customerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create loan
      const [loanResult] = await connection.execute(
        'INSERT INTO loans (customer_id, loan_type, amount, interest_rate, duration, monthly_payment, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customerId, loanType, amount, interestRate, duration, monthlyPayment, 'pending']
      );

      await connection.commit();

      res.status(201).json({
        message: 'Loan application submitted successfully',
        loan: {
          id: loanResult.insertId,
          customerId,
          loanType,
          amount,
          interestRate,
          duration,
          monthlyPayment,
          status: 'pending'
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

// Update loan status (approve/reject)
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['approved', 'rejected']),
  body('reason').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or employee
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const loanId = req.params.id;
    const { status, reason } = req.body;

    // Check if loan exists
    const [loans] = await pool.execute(
      'SELECT * FROM loans WHERE id = ?',
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loans[0];

    // Update loan status
    await pool.execute(
      'UPDATE loans SET status = ? WHERE id = ?',
      [status, loanId]
    );

    // If loan is approved, set it to active
    if (status === 'approved') {
      await pool.execute(
        'UPDATE loans SET status = ? WHERE id = ?',
        ['active', loanId]
      );
    }

    res.json({ message: `Loan ${status} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete loan (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const loanId = req.params.id;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if loan exists
      const [loans] = await connection.execute(
        'SELECT * FROM loans WHERE id = ?',
        [loanId]
      );

      if (loans.length === 0) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      // Delete loan
      await connection.execute(
        'DELETE FROM loans WHERE id = ?',
        [loanId]
      );

      await connection.commit();

      res.json({ message: 'Loan deleted successfully' });
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