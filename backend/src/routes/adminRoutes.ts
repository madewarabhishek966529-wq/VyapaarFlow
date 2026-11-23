import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.use(requireSuperAdmin);

router.get('/stats', AdminController.getPlatformStats);
router.get('/businesses', AdminController.getAllBusinesses);
router.put('/business/:id/subscription', AdminController.updateBusinessSubscription);

export default router;
