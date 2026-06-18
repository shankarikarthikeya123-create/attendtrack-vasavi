const authService = require('../services/authService');
const { pool } = require('../config/database');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is populated by authMiddleware. Let's fetch the latest site name just in case.
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.username, u.phone, u.role, u.site_id, s.site_name 
       FROM users u 
       LEFT JOIN sites s ON u.site_id = s.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = rows[0];
    return res.status(200).json({
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
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser,
  changePassword
};
