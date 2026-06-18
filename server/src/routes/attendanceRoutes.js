const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { validateBulkAttendance } = require('../validators/attendanceValidator');

// Protect all routes - require login
router.use(authMiddleware);

// Daily mark routes - open to both (internally validated inside controller)
router.get('/day', roleMiddleware(['ADMIN', 'SUPERVISOR']), attendanceController.getAttendanceForDay);
router.post('/bulk', roleMiddleware(['ADMIN', 'SUPERVISOR']), validateBulkAttendance, validationMiddleware, attendanceController.saveBulkAttendance);

// Historic log search - open to both (site isolated for supervisor inside controller)
router.get('/', roleMiddleware(['ADMIN', 'SUPERVISOR']), attendanceController.getAttendanceLogs);

module.exports = router;
