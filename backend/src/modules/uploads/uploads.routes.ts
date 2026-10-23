import { Router } from 'express';
import {
  uploadMiddleware,
  uploadSingle,
  uploadMultiple,
  getPresignedUrl,
  streamMedia,
  deleteMedia,
} from './uploads.controller';
import { requireAuth, requireRole } from '../../middlewares/auth';

const router = Router();

// Admin authenticated upload endpoints
router.post(
  '/admin/uploads',
  requireAuth,
  requireRole(['ADMIN', 'STAFF']),
  uploadMiddleware.single('file'),
  uploadSingle
);

router.post(
  '/admin/uploads/multiple',
  requireAuth,
  requireRole(['ADMIN', 'STAFF']),
  uploadMiddleware.array('files', 10),
  uploadMultiple
);

router.post(
  '/admin/uploads/presigned-url',
  requireAuth,
  requireRole(['ADMIN', 'STAFF']),
  getPresignedUrl
);

router.delete(
  '/admin/uploads',
  requireAuth,
  requireRole(['ADMIN']),
  deleteMedia
);

// Public media streaming route (supports nested paths e.g. /media/products/photo.jpg)
router.get('/media/*', streamMedia);

export default router;
