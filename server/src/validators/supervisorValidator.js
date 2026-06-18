const { body } = require('express-validator');

const validateCreateSupervisor = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Supervisor name is required.')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Must be a valid email address.')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters.'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('site_id')
    .notEmpty()
    .withMessage('Assigned site ID is required.')
    .isInt()
    .withMessage('Site ID must be a valid integer.')
];

const validateUpdateSupervisor = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Supervisor name is required.')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Must be a valid email address.')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters.'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required.')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('site_id')
    .notEmpty()
    .withMessage('Assigned site ID is required.')
    .isInt()
    .withMessage('Site ID must be a valid integer.')
];

const validateResetPassword = [
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
];

module.exports = {
  validateCreateSupervisor,
  validateUpdateSupervisor,
  validateResetPassword
};
