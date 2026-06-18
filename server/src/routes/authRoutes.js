const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { validateLogin, validateChangePassword } = require('../validators/authValidator');

// Public route
router.post('/login', validateLogin, validationMiddleware, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.patch('/change-password', authMiddleware, validateChangePassword, validationMiddleware, authController.changePassword);

module.exports = router;
