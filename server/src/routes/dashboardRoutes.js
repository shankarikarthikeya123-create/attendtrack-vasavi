const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Admin Dashboard Route
router.get('/admin', authMiddleware, roleMiddleware(['ADMIN']), dashboardController.getAdminDashboard);

// Supervisor Dashboard Route
router.get('/supervisor', authMiddleware, roleMiddleware(['SUPERVISOR']), dashboardController.getSupervisorDashboard);

module.exports = router;
