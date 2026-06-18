const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

// Fetch all supervisors (Admin only)
const getSupervisors = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.role, u.site_id, u.is_active, u.created_at, s.site_name
       FROM users u
       LEFT JOIN sites s ON u.site_id = s.id
       WHERE u.role = 'SUPERVISOR'
       ORDER BY u.created_at DESC`
    );

    const supervisors = rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      role: row.role,
      siteId: row.site_id,
      siteName: row.site_name || 'Unassigned',
      isActive: !!row.is_active,
      createdAt: row.created_at
    }));

    return res.status(200).json(supervisors);
  } catch (error) {
    next(error);
  }
};

// Fetch single supervisor
const getSupervisorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.role, u.site_id, u.is_active, u.created_at, s.site_name
       FROM users u
       LEFT JOIN sites s ON u.site_id = s.id
       WHERE u.id = ? AND u.role = 'SUPERVISOR'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Supervisor not found.' });
    }

    const row = rows[0];
    const supervisor = {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      role: row.role,
      siteId: row.site_id,
      siteName: row.site_name || 'Unassigned',
      isActive: !!row.is_active,
      createdAt: row.created_at
    };

    return res.status(200).json(supervisor);
  } catch (error) {
    next(error);
  }
};

// Create supervisor account
const createSupervisor = async (req, res, next) => {
  try {
    const { full_name, email, username, phone, password, site_id } = req.body;

    // 1. Verify Site Exists
    const [siteExists] = await pool.query('SELECT id FROM sites WHERE id = ?', [site_id]);
    if (siteExists.length === 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'site_id', message: 'Assigned construction site does not exist.' }]
      });
    }

    // 2. Verify Email uniqueness
    const [emailExists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (emailExists.length > 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'email', message: 'Email address is already in use.' }]
      });
    }

    // 3. Verify Username uniqueness
    const [usernameExists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (usernameExists.length > 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'username', message: 'Username is already taken.' }]
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert Supervisor
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, username, phone, password_hash, role, site_id)
       VALUES (?, ?, ?, ?, ?, 'SUPERVISOR', ?)`,
      [full_name, email, username.toLowerCase(), phone, passwordHash, site_id]
    );

    return res.status(201).json({
      id: result.insertId,
      message: 'Supervisor account created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Update supervisor account
const updateSupervisor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, email, username, phone, site_id } = req.body;

    // Verify supervisor exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ? AND role = \'SUPERVISOR\'', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Supervisor not found.' });
    }

    // 1. Verify Site Exists
    const [siteExists] = await pool.query('SELECT id FROM sites WHERE id = ?', [site_id]);
    if (siteExists.length === 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'site_id', message: 'Assigned construction site does not exist.' }]
      });
    }

    // 2. Verify Email uniqueness
    const [emailExists] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (emailExists.length > 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'email', message: 'Email address is already in use.' }]
      });
    }

    // 3. Verify Username uniqueness
    const [usernameExists] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (usernameExists.length > 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'username', message: 'Username is already taken.' }]
      });
    }

    await pool.query(
      `UPDATE users 
       SET full_name = ?, email = ?, username = ?, phone = ?, site_id = ? 
       WHERE id = ? AND role = 'SUPERVISOR'`,
      [full_name, email, username.toLowerCase(), phone, site_id, id]
    );

    return res.status(200).json({ message: 'Supervisor account updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Toggle supervisor active/inactive status
const toggleSupervisorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ message: 'is_active status field is required.' });
    }

    // Verify supervisor exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ? AND role = \'SUPERVISOR\'', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Supervisor not found.' });
    }

    const activeVal = is_active ? 1 : 0;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ? AND role = \'SUPERVISOR\'', [activeVal, id]);

    const statusMsg = is_active ? 'reactivated' : 'deactivated';
    return res.status(200).json({ message: `Supervisor account successfully ${statusMsg}.` });
  } catch (error) {
    next(error);
  }
};

// Reset supervisor password by Admin
const resetSupervisorPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Verify supervisor exists
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ? AND role = \'SUPERVISOR\'', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Supervisor not found.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ? AND role = \'SUPERVISOR\'', [passwordHash, id]);

    return res.status(200).json({ message: 'Supervisor password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSupervisors,
  getSupervisorById,
  createSupervisor,
  updateSupervisor,
  toggleSupervisorStatus,
  resetSupervisorPassword
};
