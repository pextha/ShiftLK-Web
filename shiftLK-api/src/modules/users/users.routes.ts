import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createUserSchema, updateUserStatusSchema } from './users.schema';
import * as usersController from './users.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', usersController.getAllUsers);
router.post('/', validateBody(createUserSchema), usersController.createUser);
router.patch('/:id/status', validateBody(updateUserStatusSchema), usersController.updateStatus);

export default router;
