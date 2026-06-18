const { body } = require('express-validator');

const validateCreateSite = [
  body('site_code')
    .trim()
    .notEmpty()
    .withMessage('Site code is required.')
    .isLength({ max: 50 })
    .withMessage('Site code must not exceed 50 characters.'),
  body('site_name')
    .trim()
    .notEmpty()
    .withMessage('Site name is required.')
    .isLength({ max: 255 })
    .withMessage('Site name must not exceed 255 characters.'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required.'),
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required.')
    .isDate()
    .withMessage('Start date must be a valid date (YYYY-MM-DD).'),
  body('expected_completion_date')
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage('Expected completion date must be a valid date.')
];

const validateUpdateSite = [
  body('site_name')
    .trim()
    .notEmpty()
    .withMessage('Site name is required.')
    .isLength({ max: 255 })
    .withMessage('Site name must not exceed 255 characters.'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required.'),
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required.')
    .isDate()
    .withMessage('Start date must be a valid date (YYYY-MM-DD).'),
  body('expected_completion_date')
    .optional({ checkFalsy: true })
    .isDate()
    .withMessage('Expected completion date must be a valid date.')
];

module.exports = {
  validateCreateSite,
  validateUpdateSite
};
