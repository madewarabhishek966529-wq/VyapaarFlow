import { Router } from 'express';
import { UdhaarController } from '../controllers/udhaarController';
import { authenticateJWT } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/summary', UdhaarController.getUdhaarSummary);
router.post('/payment', UdhaarController.recordPayment);
router.get('/reminder/:customerId', UdhaarController.generateReminderLink);

export default router;
