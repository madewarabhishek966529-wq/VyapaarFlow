import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticateJWT } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/', CustomerController.getAll);
router.post('/', CustomerController.create);
router.put('/:id', CustomerController.update);
router.get('/:id', CustomerController.getDetails);

export default router;
