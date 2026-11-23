import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/', SupplierController.getAll);
router.post('/', requireRoles([UserRole.OWNER, UserRole.MANAGER]), SupplierController.create);
router.post('/purchase', requireRoles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY_MANAGER]), SupplierController.recordPurchase);
router.get('/:id', SupplierController.getDetails);

export default router;
