const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token payload:', verified);
    
    // Map the token payload to match the users table schema
    req.user = {
      id: verified.userId,
      role: verified.role
    };
    
    console.log('Authenticated user:', req.user);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateToken; 