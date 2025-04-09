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
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [loans] = await pool.query(`
      SELECT l.*, 
             c.first_name, c.last_name, c.email, c.phone,
             a.street, a.city, a.state, a.postal_code, a.country,
             lp.name as product_name, lp.description as product_description
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN addresses a ON c.address_id = a.id
      JOIN loan_products lp ON l.loan_product_id = lp.id
      ORDER BY l.created_at DESC
    `);

    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all loans for a customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Check if user is admin or the customer themselves
    // if (req.user.role !== 'admin' && req.user.userId !== parseInt(customerId)) {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    const [loans] = await pool.execute(`
      SELECT l.*, 
             lp.name as product_name, 
             lp.description as product_description,
             lp.interest_rate as product_interest_rate
      FROM loans l
      LEFT JOIN loan_products lp ON l.loan_product_id = lp.id
      WHERE l.customer_id = 4
      ORDER BY l.created_at DESC
    `, [customerId]);

    // Format the response
    const formattedLoans = loans.map(loan => ({
      id: loan.id,
      loanType: loan.loan_type,
      amount: loan.amount,
      interestRate: loan.interest_rate,
      duration: loan.duration,
      monthlyPayment: loan.monthly_payment,
      status: loan.status,
      createdAt: loan.created_at,
      product: {
        id: loan.loan_product_id,
        name: loan.product_name,
        description: loan.product_description,
        interestRate: loan.product_interest_rate
      }
    }));

    res.json(formattedLoans);
  } catch (error) {
    console.error('Error fetching customer loans:', error);
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

// Get loan payments
router.get('/:id/payments', authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.id;

    // Check if loan exists
    const [loans] = await pool.execute(
      'SELECT * FROM loans WHERE id = ?',
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if user is admin or the loan owner
    if (req.user.role !== 'admin' && req.user.userId !== loan.customer_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get loan payments
    const [payments] = await pool.execute(`
      SELECT 
        p.*,
        a.account_number as source_account_number,
        a.account_type as source_account_type
      FROM loan_payments p
      LEFT JOIN accounts a ON p.loan_id = a.id
      WHERE p.loan_id = ?
      ORDER BY p.payment_date DESC
    `, [loanId]);

    // Calculate payment schedule
    const paymentSchedule = [];
    const monthlyPayment = loan.monthly_payment;
    const totalAmount = loan.amount;
    const interestRate = loan.interest_rate;
    const duration = loan.duration;
    let remainingBalance = totalAmount;

    for (let i = 0; i < duration; i++) {
      const interestPayment = remainingBalance * (interestRate / 100 / 12);
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      paymentSchedule.push({
        paymentNumber: i + 1,
        dueDate: new Date(loan.created_at).setMonth(new Date(loan.created_at).getMonth() + i + 1),
        amount: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0
      });
    }

    res.json({
      loan: {
        id: loan.id,
        loan_type: loan.loan_type,
        amount: loan.amount,
        interest_rate: loan.interest_rate,
        duration: loan.duration,
        monthly_payment: loan.monthly_payment,
        status: loan.status,
        created_at: loan.created_at
      },
      payments: payments,
      paymentSchedule: paymentSchedule
    });
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
  body('monthlyPayment').isFloat({ min: 0 }),
  body('loan_product_id').isInt()
], async (req, res) => {
  try {
    console.log('Received loan application request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, loanType, amount, interestRate, duration, monthlyPayment, loan_product_id } = req.body;

    // Check if user is admin or the customer themselves
    if (req.user.role !== 'admin' && req.user.userId !== customerId) {
      console.log('Access denied for user:', req.user.userId, 'customer:', customerId);
      return res.status(403).json({ message: 'Access denied' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create loan
      const [loanResult] = await connection.execute(
        'INSERT INTO loans (customer_id, loan_type, amount, interest_rate, duration, monthly_payment, status, loan_product_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customerId, loanType, amount, interestRate, duration, monthlyPayment, 'pending', loan_product_id]
      );

      await connection.commit();

      console.log('Loan created successfully with ID:', loanResult.insertId);

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
          status: 'pending',
          loan_product_id
        }
      });
    } catch (error) {
      console.error('Error creating loan:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Server error in loan creation:', error);
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