import { Router } from 'express';
import { ExpenseController } from '../controllers/expenseController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/', ExpenseController.getAll);
router.post('/', ExpenseController.create);
router.delete('/:id', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ExpenseController.delete);

export default router;
