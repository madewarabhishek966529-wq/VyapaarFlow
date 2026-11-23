import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/', NotificationController.getAll);
router.put('/mark-all-read', NotificationController.markAllRead);
router.put('/:id/read', NotificationController.markRead);

export default router;
