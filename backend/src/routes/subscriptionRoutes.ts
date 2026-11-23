import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/info', SubscriptionController.getSubscriptionInfo);
router.post('/checkout', requireRoles([UserRole.OWNER]), SubscriptionController.checkout);

export default router;
