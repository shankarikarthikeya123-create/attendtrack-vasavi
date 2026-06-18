const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { 
  validateCreateSupervisor, 
  validateUpdateSupervisor, 
  validateResetPassword 
} = require('../validators/supervisorValidator');

// Protect all routes - Admin only
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/', supervisorController.getSupervisors);
router.get('/:id', supervisorController.getSupervisorById);
router.post('/', validateCreateSupervisor, validationMiddleware, supervisorController.createSupervisor);
router.put('/:id', validateUpdateSupervisor, validationMiddleware, supervisorController.updateSupervisor);
router.patch('/:id/status', supervisorController.toggleSupervisorStatus);
router.patch('/:id/reset-password', validateResetPassword, validationMiddleware, supervisorController.resetSupervisorPassword);

module.exports = router;
