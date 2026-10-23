import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import * as auditController from './audit.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/', auditController.getAuditLogs);

export default router;
