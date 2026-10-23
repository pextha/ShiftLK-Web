import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import multer from 'multer';
import {
  uploadBufferToR2,
  createR2PresignedUploadUrl,
  getR2ObjectStream,
  deleteFromR2,
} from '../../lib/r2';
import { AppError } from '../../middlewares/errorHandler';
import { env } from '../../config/env';

// Multer memory storage configuration
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'INVALID_FILE_TYPE',
          `File type ${file.mimetype} is not allowed. Only JPG, PNG, WEBP, and GIF images are supported.`,
          400
        )
      );
    }
  },
});

function getCleanExtension(originalName: string, mimeType: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/^\./, '');
  if (ext) return ext;
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'bin';
}

/**
 * Handle single file upload to Cloudflare R2
 */
export async function uploadSingle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError('FILE_REQUIRED', 'Please provide an image file to upload', 400);
    }

    const folder = (req.body.folder || 'products').replace(/[^a-z0-9_-]/gi, '');
    const ext = getCleanExtension(req.file.originalname, req.file.mimetype);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const key = `${folder}/${uniqueSuffix}.${ext}`;

    const uploaded = await uploadBufferToR2(req.file.buffer, key, req.file.mimetype);

    res.status(201).json({
      data: {
        key: uploaded.key,
        url: uploaded.publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle multiple files upload to Cloudflare R2
 */
export async function uploadMultiple(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('FILES_REQUIRED', 'Please select at least one image file to upload', 400);
    }

    const folder = (req.body.folder || 'products').replace(/[^a-z0-9_-]/gi, '');

    const uploadPromises = files.map(async (file) => {
      const ext = getCleanExtension(file.originalname, file.mimetype);
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      const key = `${folder}/${uniqueSuffix}.${ext}`;

      const uploaded = await uploadBufferToR2(file.buffer, key, file.mimetype);

      return {
        key: uploaded.key,
        url: uploaded.publicUrl,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    });

    const results = await Promise.all(uploadPromises);

    res.status(201).json({
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate presigned PUT URL for client direct upload to Cloudflare R2
 */
export async function getPresignedUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fileName, fileType, folder = 'products' } = req.body;

    if (!fileName || !fileType) {
      throw new AppError('PARAMS_REQUIRED', 'fileName and fileType are required', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new AppError(
        'INVALID_FILE_TYPE',
        `File type ${fileType} is not allowed. Only JPG, PNG, WEBP, and GIF images are supported.`,
        400
      );
    }

    const ext = getCleanExtension(fileName, fileType);
    const cleanFolder = folder.replace(/[^a-z0-9_-]/gi, '') || 'products';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const key = `${cleanFolder}/${uniqueSuffix}.${ext}`;

    const presigned = await createR2PresignedUploadUrl(key, fileType, 300);

    res.json({
      data: presigned,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Edge Media Proxy Stream
 * Streams media directly from R2 if public CDN domain is not configured or in development
 */
export async function streamMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract key from wildcard route
    const rawKey = req.params[0] || (req.params as any).key;
    if (!rawKey) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
      return;
    }

    const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
    const media = await getR2ObjectStream(key);

    if (!media) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
      return;
    }

    res.setHeader('Content-Type', media.contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (media.contentLength) {
      res.setHeader('Content-Length', media.contentLength);
    }
    if (media.etag) {
      res.setHeader('ETag', media.etag);
    }
    if (media.lastModified) {
      res.setHeader('Last-Modified', media.lastModified.toUTCString());
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    media.stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete media object from Cloudflare R2
 */
export async function deleteMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key } = req.body;
    if (!key) {
      throw new AppError('KEY_REQUIRED', 'Object key is required to delete media', 400);
    }

    await deleteFromR2(key);

    res.json({
      data: { success: true, message: 'Media successfully deleted from Cloudflare R2' },
    });
  } catch (error) {
    next(error);
  }
}
