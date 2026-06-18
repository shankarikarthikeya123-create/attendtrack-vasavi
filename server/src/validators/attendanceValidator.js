const { body } = require('express-validator');

const validateBulkAttendance = [
  body('site_id')
    .notEmpty()
    .withMessage('Site ID is required.')
    .isInt()
    .withMessage('Site ID must be a valid integer.'),
  body('attendance_date')
    .notEmpty()
    .withMessage('Attendance date is required.')
    .isDate()
    .withMessage('Attendance date must be a valid date (YYYY-MM-DD).')
    .custom((value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      // Reset hours to compare dates only
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        throw new Error('Attendance date cannot be in the future.');
      }
      return true;
    }),
  body('records')
    .isArray({ min: 1 })
    .withMessage('Attendance records array is required and must contain at least one worker record.'),
  body('records.*.worker_id')
    .notEmpty()
    .withMessage('Worker ID is required for each record.')
    .isInt()
    .withMessage('Worker ID must be a valid integer.'),
  body('records.*.status')
    .notEmpty()
    .withMessage('Status is required for each record.')
    .isIn(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'])
    .withMessage('Status must be one of: PRESENT, ABSENT, HALF_DAY, LEAVE.')
];

const validateQueryAttendance = [
  body('date')
    .optional()
    .isDate()
    .withMessage('Query date must be a valid date (YYYY-MM-DD).')
];

module.exports = {
  validateBulkAttendance,
  validateQueryAttendance
};
