const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserService = require('../services/userService');
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

// Register new user
router.post('/register', [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim().escape(),
    body('lastName').notEmpty().trim().escape(),
    body('dateOfBirth').isDate(),
    body('street').notEmpty().trim().escape(),
    body('city').notEmpty().trim().escape(),
    body('state').notEmpty().trim().escape(),
    body('postalCode').notEmpty().trim().escape(),
    body('country').notEmpty().trim().escape(),
    body('phone').notEmpty().trim().escape(),
    body('role').isIn(['customer', 'employee']),
    body('position').if(body('role').equals('employee')).notEmpty().trim().escape(),
    body('department').if(body('role').equals('employee')).notEmpty().trim().escape(),
    body('hireDate').if(body('role').equals('employee')).isDate()
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            dateOfBirth,
            street,
            city,
            state,
            postalCode,
            country,
            phone,
            position,
            department,
            hireDate
        } = req.body;

      

        // Register user using UserService
        const result = await UserService.registerUser({
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            dateOfBirth,
            street,
            city,
            state,
            postalCode,
            country,
            phone,
            position,
            department,
            hireDate
        });

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.userId, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: result.message,
            token,
            user: {
                id: result.userId,
                username,
                email,
                role,
                customerId: result.customerId,
                employeeId: result.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
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