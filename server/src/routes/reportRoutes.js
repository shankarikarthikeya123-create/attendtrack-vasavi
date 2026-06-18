const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all routes - require login
router.use(authMiddleware);

// Monthly report - accessible by Admin and Supervisor (site restricted inside controller)
router.get('/monthly', roleMiddleware(['ADMIN', 'SUPERVISOR']), reportController.getMonthlyReport);

module.exports = router;
