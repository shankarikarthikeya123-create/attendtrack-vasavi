const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const login = async (loginIdentifier, password) => {
  // Check if identifier is email or username
  const [rows] = await pool.query(
    `SELECT u.*, s.site_name 
     FROM users u 
     LEFT JOIN sites s ON u.site_id = s.id 
     WHERE u.email = ? OR u.username = ?`,
    [loginIdentifier, loginIdentifier]
  );

  if (rows.length === 0) {
    throw { statusCode: 401, message: 'Invalid credentials. Please check your username/email and password.' };
  }

  const user = rows[0];

  if (!user.is_active) {
    throw { statusCode: 403, message: 'This account has been deactivated. Please contact the administrator.' };
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid credentials. Please check your username/email and password.' };
  }

  // Create JWT Payload
  const payload = {
    id: user.id,
    role: user.role,
    site_id: user.site_id
  };

  // Sign Token
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'replace_with_a_secure_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role,
      siteId: user.site_id,
      siteName: user.site_name
    }
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  // Fetch user password_hash
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) {
    throw { statusCode: 404, message: 'User not found.' };
  }

  const user = rows[0];

  // Compare current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 400, message: 'Current password is incorrect.' };
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update in database
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, userId]);

  return { message: 'Password updated successfully.' };
};

module.exports = {
  login,
  changePassword
};
