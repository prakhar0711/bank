const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
// const bcrypt = require('bcrypt');

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

// Register user
router.post('/register', [
  body('username').notEmpty().trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('dateOfBirth').isDate(),
  body('phone').notEmpty().trim(),
  body('street').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('state').notEmpty().trim(),
  body('postalCode').notEmpty().trim(),
  body('country').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      role,
      position,
      department,
      hireDate
    } = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if username or email already exists
      const [existingUsers] = await connection.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Create address
      const [addressResult] = await connection.query(
        'INSERT INTO addresses (street, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?)',
        [street, city, state, postalCode, country]
      );

      // Create user
      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role || 'customer']
      );

      if (role === 'employee') {
        // Create employee
        await connection.query(
          'INSERT INTO employees (user_id, first_name, last_name, date_of_birth, address_id, phone, email, position, department, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userResult.insertId, firstName, lastName, dateOfBirth, addressResult.insertId, phone, email, position, department, hireDate]
        );
      } else {
        // Create customer
        await connection.query(
          'INSERT INTO customers (user_id, first_name, last_name, date_of_birth, address_id, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userResult.insertId, firstName, lastName, dateOfBirth, addressResult.insertId, phone, email]
        );
      }

      await connection.commit();

      // Generate JWT token
      const token = jwt.sign(
        { id: userResult.insertId, role: role || 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: userResult.insertId,
          username,
          email,
          role: role || 'customer'
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', [
  body('username').trim().escape(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Get user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare plain text passwords instead of using bcrypt
    if (password !== user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If user is a customer, get their customer ID
    let customerId = null;
    if (user.role === 'customer') {
      const [customers] = await pool.execute(
        'SELECT id FROM customers WHERE user_id = ?',
        [user.id]
      );
      if (customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // Create JWT token with customer ID for customers
    const tokenPayload = {
      id: user.role === 'customer' ? customerId : user.id,
      userId: user.id,
      role: user.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: tokenPayload.id,
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 