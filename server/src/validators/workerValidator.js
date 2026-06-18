const { body } = require('express-validator');

const validateCreateWorker = [
  body('worker_code')
    .trim()
    .notEmpty()
    .withMessage('Worker code is required.')
    .isLength({ max: 50 })
    .withMessage('Worker code must not exceed 50 characters.'),
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required.')
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters.'),
  body('site_id')
    .notEmpty()
    .withMessage('Assigned site ID is required.')
    .isInt()
    .withMessage('Site ID must be a valid integer.'),
  body('daily_wage')
    .notEmpty()
    .withMessage('Daily wage is required.')
    .isFloat({ min: 0.01 })
    .withMessage('Daily wage must be a positive number greater than zero.'),
  body('joining_date')
    .notEmpty()
    .withMessage('Joining date is required.')
    .isDate()
    .withMessage('Joining date must be a valid date (YYYY-MM-DD).'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('emergency_contact')
    .optional({ checkFalsy: true })
    .trim(),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
];

const validateUpdateWorker = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required.')
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters.'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required.')
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters.'),
  body('site_id')
    .notEmpty()
    .withMessage('Assigned site ID is required.')
    .isInt()
    .withMessage('Site ID must be a valid integer.'),
  body('daily_wage')
    .notEmpty()
    .withMessage('Daily wage is required.')
    .isFloat({ min: 0.01 })
    .withMessage('Daily wage must be a positive number greater than zero.'),
  body('joining_date')
    .notEmpty()
    .withMessage('Joining date is required.')
    .isDate()
    .withMessage('Joining date must be a valid date (YYYY-MM-DD).'),
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  body('emergency_contact')
    .optional({ checkFalsy: true })
    .trim(),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
];

module.exports = {
  validateCreateWorker,
  validateUpdateWorker
};
