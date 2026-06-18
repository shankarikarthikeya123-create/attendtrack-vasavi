const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please login.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'replace_with_a_secure_secret');
    } catch (err) {
      return res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
    }

    // Verify user exists and is active in the database
    const [rows] = await pool.query(
      'SELECT id, full_name, email, username, role, site_id, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      site_id: user.site_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server authentication error.' });
  }
};

module.exports = authMiddleware;
