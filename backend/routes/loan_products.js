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

// Get all loan products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [loanProducts] = await pool.execute(`
      SELECT * FROM loan_products
      ORDER BY name ASC
    `);

    res.json(loanProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get loan product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await pool.execute(`
      SELECT * FROM loan_products
      WHERE id = ?
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Loan product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new loan product (admin only)
router.post('/', [
  authenticateToken,
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('loan_type').isIn(['personal', 'home', 'car', 'business']),
  body('min_amount').isFloat({ min: 0 }),
  body('max_amount').isFloat({ min: 0 }),
  body('min_duration').isInt({ min: 1 }),
  body('max_duration').isInt({ min: 1 }),
  body('interest_rate').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      name, 
      description, 
      loan_type,
      min_amount, 
      max_amount, 
      min_duration,
      max_duration,
      interest_rate
    } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create loan product
      const [result] = await connection.execute(
        `INSERT INTO loan_products 
        (name, description, loan_type, min_amount, max_amount, min_duration, max_duration, interest_rate, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, loan_type, min_amount, max_amount, min_duration, max_duration, interest_rate, req.user.userId]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Loan product created successfully',
        product: {
          id: result.insertId,
          name,
          description,
          loan_type,
          min_amount,
          max_amount,
          min_duration,
          max_duration,
          interest_rate
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

// Update loan product (admin only)
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('loan_type').optional().isIn(['personal', 'home', 'car', 'business']),
  body('min_amount').optional().isFloat({ min: 0 }),
  body('max_amount').optional().isFloat({ min: 0 }),
  body('min_duration').optional().isInt({ min: 1 }),
  body('max_duration').optional().isInt({ min: 1 }),
  body('interest_rate').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const productId = req.params.id;
    const updateData = req.body;

    // Check if product exists
    const [products] = await pool.execute(
      'SELECT * FROM loan_products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Loan product not found' });
    }

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (updateData.name) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }

    if (updateData.description) {
      updateFields.push('description = ?');
      updateValues.push(updateData.description);
    }

    if (updateData.loan_type) {
      updateFields.push('loan_type = ?');
      updateValues.push(updateData.loan_type);
    }

    if (updateData.min_amount) {
      updateFields.push('min_amount = ?');
      updateValues.push(updateData.min_amount);
    }

    if (updateData.max_amount) {
      updateFields.push('max_amount = ?');
      updateValues.push(updateData.max_amount);
    }

    if (updateData.min_duration) {
      updateFields.push('min_duration = ?');
      updateValues.push(updateData.min_duration);
    }

    if (updateData.max_duration) {
      updateFields.push('max_duration = ?');
      updateValues.push(updateData.max_duration);
    }

    if (updateData.interest_rate) {
      updateFields.push('interest_rate = ?');
      updateValues.push(updateData.interest_rate);
    }

    if (updateData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updateData.is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add the ID to the values array
    updateValues.push(productId);

    // Update the product
    await pool.execute(
      `UPDATE loan_products SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Loan product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete loan product (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const productId = req.params.id;

    // Check if product exists
    const [products] = await pool.execute(
      'SELECT * FROM loan_products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Loan product not found' });
    }

    // Delete the product
    await pool.execute(
      'DELETE FROM loan_products WHERE id = ?',
      [productId]
    );

    res.json({ message: 'Loan product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 