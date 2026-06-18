const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const { validateCreateSite, validateUpdateSite } = require('../validators/siteValidator');

// Require authentication for all routes
router.use(authMiddleware);

// Admin-only management endpoints
router.get('/', roleMiddleware(['ADMIN']), siteController.getSites);
router.get('/:id', roleMiddleware(['ADMIN']), siteController.getSiteById);
router.post('/', roleMiddleware(['ADMIN']), validateCreateSite, validationMiddleware, siteController.createSite);
router.put('/:id', roleMiddleware(['ADMIN']), validateUpdateSite, validationMiddleware, siteController.updateSite);
router.patch('/:id/status', roleMiddleware(['ADMIN']), siteController.toggleSiteStatus);

// Workers sub-list - allowed for Admin AND site supervisor (ownership check in controller)
router.get('/:id/workers', roleMiddleware(['ADMIN', 'SUPERVISOR']), siteController.getSiteWorkers);

module.exports = router;
