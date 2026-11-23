import { Router } from 'express';
import { BusinessController } from '../controllers/businessController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);

router.post('/onboard', BusinessController.createOrOnboard);
router.get('/current', requireTenant, BusinessController.getDetails);
router.put('/settings', requireTenant, requireRoles([UserRole.OWNER, UserRole.MANAGER]), BusinessController.updateSettings);

export default router;
