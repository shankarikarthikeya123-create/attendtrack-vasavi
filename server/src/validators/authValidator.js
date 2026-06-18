const { body } = require('express-validator');

const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long.')
];

module.exports = {
  validateLogin,
  validateChangePassword
};
