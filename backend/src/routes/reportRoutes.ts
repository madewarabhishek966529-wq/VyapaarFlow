import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { UserRole } from '@vyapaarflow/shared';

const router = Router();

router.use(authenticateJWT);
router.use(requireTenant);

router.get('/dashboard', ReportController.getDashboard);
router.get('/sales', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ReportController.getSalesReport);
router.get('/profit-loss', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ReportController.getProfitLossReport);
router.get('/tax-summary', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ReportController.getTaxSummary);
router.get('/export-sales-csv', requireRoles([UserRole.OWNER, UserRole.MANAGER]), ReportController.exportSalesCsv);

export default router;
