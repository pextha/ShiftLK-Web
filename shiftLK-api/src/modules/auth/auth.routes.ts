import { Router } from 'express';
import { validateBody } from '../../middlewares/validate';
import { authLimiter } from '../../middlewares/rateLimiter';
import { requireAuth } from '../../middlewares/auth';
import { loginSchema, refreshSchema, changePasswordSchema } from './auth.schema';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshSchema), authController.refreshToken);
router.post('/logout', requireAuth, authController.logout);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);
router.get('/me', requireAuth, authController.getMe);

export default router;
