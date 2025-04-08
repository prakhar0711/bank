const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2/promise');

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
  body('username').trim().isLength({ min: 3 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['customer', 'employee']),
  body('first_name').trim().notEmpty().escape(),
  body('last_name').trim().notEmpty().escape(),
  body('date_of_birth').isDate(),
  body('phone').optional().trim().escape(),
  body('address').optional().trim().escape(),
  body('position').if(body('role').equals('employee')).notEmpty().escape(),
  body('department').if(body('role').equals('employee')).notEmpty().escape(),
  body('hire_date').if(body('role').equals('employee')).isDate()
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
      role, 
      first_name, 
      last_name, 
      date_of_birth, 
      phone, 
      address,
      position,
      department,
      hire_date
    } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert new user with plain text password
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role]
      );

      const userId = userResult.insertId;

      // Create profile based on role
      if (role === 'customer') {
        await connection.execute(
          'INSERT INTO customers (user_id, first_name, last_name, date_of_birth, phone, address, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, first_name, last_name, date_of_birth, phone, address, email]
        );
      } else if (role === 'employee') {
        await connection.execute(
          'INSERT INTO employees (user_id, first_name, last_name, date_of_birth, phone, address, email, position, department, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [userId, first_name, last_name, date_of_birth, phone, address, email, position, department, hire_date]
        );
      }

      await connection.commit();

      // Create JWT token
      const token = jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: userId, username, email, role }
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

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
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