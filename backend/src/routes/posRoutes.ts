import { Router } from 'express';
import { PosController } from '../controllers/posController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.post('/sale', PosController.createSale);
router.get('/sales', PosController.getAllSales);
router.get('/sale/:id', PosController.getSaleById);
router.get('/receipt/:id', PosController.getThermalReceipt);
router.get('/upi-qr', PosController.getUpiQr);
router.post('/sale/:id/return', requireRoles([UserRole.OWNER, UserRole.MANAGER]), PosController.returnSale);

export default router;
