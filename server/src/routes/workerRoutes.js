const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { validateCreateWorker, validateUpdateWorker } = require('../validators/workerValidator');

// Protect all routes - Admin only
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/', workerController.getWorkers);
router.get('/:id', workerController.getWorkerById);
router.post('/', validateCreateWorker, validationMiddleware, workerController.createWorker);
router.put('/:id', validateUpdateWorker, validationMiddleware, workerController.updateWorker);
router.patch('/:id/status', workerController.toggleWorkerStatus);
router.get('/:id/attendance-summary', workerController.getWorkerAttendanceSummary);

module.exports = router;
