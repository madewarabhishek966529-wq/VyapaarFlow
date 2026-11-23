import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/', ProductController.getAll);
router.get('/barcode/:code', ProductController.lookupBarcode);
router.get('/movements/:productId?', ProductController.getMovements);
router.post('/', requireRoles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY_MANAGER]), ProductController.create);
router.put('/:id', requireRoles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY_MANAGER]), ProductController.update);
router.delete('/:id', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ProductController.delete);
router.post('/adjust-stock', requireRoles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY_MANAGER]), ProductController.adjustStock);

export default router;
