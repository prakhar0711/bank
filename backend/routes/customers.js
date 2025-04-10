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

// Get all customers (for employees and admins)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or employee
    // if (req.user.role !== 'employee') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    // First get all customers with their basic info and address
    const [customers] = await pool.execute(`
      SELECT 
        c.*, 
        u.username, 
        u.email, 
        u.role,
        a.street,
        a.city,
        a.state,
        a.postal_code,
        a.country
      FROM customers c
      JOIN users u ON c.user_id = u.id
      JOIN addresses a ON c.address_id = a.id
      ORDER BY c.created_at DESC
    `);

    // For each customer, get their accounts and loans
    const customersWithDetails = await Promise.all(customers.map(async (customer) => {
      // Get customer's accounts
      const [accounts] = await pool.execute(`
        SELECT a.*
        FROM accounts a
        WHERE a.customer_id = ?
        ORDER BY a.created_at DESC
      `, [customer.id]);

      // Get customer's loans
      const [loans] = await pool.execute(`
        SELECT l.*
        FROM loans l
        WHERE l.customer_id = ?
        ORDER BY l.created_at DESC
      `, [customer.id]);

      return {
        ...customer,
        accounts,
        loans
      };
    }));

    res.json(customersWithDetails);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or requesting their own data
    // if (req.user.role !== 'employee' && req.user.id !== parseInt(req.params.id)) {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    const [customer] = await pool.query(`
      SELECT c.*, a.street, a.city, a.state, a.postal_code, a.country
      FROM customers c
      LEFT JOIN addresses a ON c.address_id = a.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get customer's accounts
    const [accounts] = await pool.query(`
      SELECT * FROM accounts 
      WHERE customer_id = ?
    `, [req.params.id]);

    // Get customer's loans
    const [loans] = await pool.query(`
      SELECT * FROM loans 
      WHERE customer_id = ?
    `, [req.params.id]);

    res.json({
      ...customer,
      accounts,
      loans
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer' });
  }
});

// Create new customer
router.post('/', [
  body('name').notEmpty().trim(),
  body('dateOfBirth').isDate(),
  body('phoneNumber').notEmpty().trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('street').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('zipCode').notEmpty().trim(),
  body('country').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      dateOfBirth,
      phoneNumber,
      email,
      password,
      street,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create address
      const [addressResult] = await connection.execute(
        'INSERT INTO Address (Street, City, State, ZipCode, Country) VALUES (?, ?, ?, ?, ?)',
        [street, city, state, zipCode, country]
      );

      // Create customer
      const [customerResult] = await connection.execute(
        'INSERT INTO Customer (Name, DateOfBirth, PhoneNumber, Email, Password, AddressID) VALUES (?, ?, ?, ?, ?, ?)',
        [name, dateOfBirth, phoneNumber, email, password, addressResult.insertId]
      );

      await connection.commit();

      // Create JWT token
      const token = jwt.sign(
        { userId: customerResult.insertId, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Customer created successfully',
        token,
        customer: {
          id: customerResult.insertId,
          name,
          email,
          role: 'customer'
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

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    if ((req.user.role != 'employee' || req.user.role !='customer') && req.user.userId !== parseInt(customerId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      phoneNumber,
      email,
      street,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get customer's address ID
      const [customers] = await connection.execute(
        'SELECT AddressID FROM Customer WHERE CustomerID = ?',
        [customerId]
      );

      if (customers.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Update address
      await connection.execute(
        'UPDATE Address SET Street = ?, City = ?, State = ?, ZipCode = ?, Country = ? WHERE AddressID = ?',
        [street, city, state, zipCode, country, customers[0].AddressID]
      );

      // Update customer
      await connection.execute(
        'UPDATE Customer SET Name = ?, PhoneNumber = ?, Email = ? WHERE CustomerID = ?',
        [name, phoneNumber, email, customerId]
      );

      await connection.commit();

      res.json({ message: 'Customer updated successfully' });
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

// Delete customer (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const customerId = req.params.id;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get customer's address ID
      const [customers] = await connection.execute(
        'SELECT AddressID FROM Customer WHERE CustomerID = ?',
        [customerId]
      );

      if (customers.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // Delete customer
      await connection.execute(
        'DELETE FROM Customer WHERE CustomerID = ?',
        [customerId]
      );

      // Delete address
      await connection.execute(
        'DELETE FROM Address WHERE AddressID = ?',
        [customers[0].AddressID]
      );

      await connection.commit();

      res.json({ message: 'Customer deleted successfully' });
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

// Get current customer's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get customer ID from user ID
    const [customer] = await pool.query(`
      SELECT c.*, a.street, a.city, a.state, a.postal_code, a.country
      FROM customers c
      LEFT JOIN addresses a ON c.address_id = a.id
      WHERE c.id = ?
    `, [req.user.id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    // Get customer's accounts
    const [accounts] = await pool.query(`
      SELECT * FROM accounts 
      WHERE customer_id = ?
    `, [customer.id]);

    // Get customer's loans
    const [loans] = await pool.query(`
      SELECT * FROM loans 
      WHERE customer_id = ?
    `, [customer.id]);

    res.json({
      ...customer,
      accounts,
      loans
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ message: 'Error fetching customer profile' });
  }
});

module.exports = router; 