import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import {
  uploadBufferToR2,
  createR2PresignedUploadUrl,
  getR2ObjectStream,
  deleteFromR2,
} from '../../lib/r2';
import { AppError } from '../../middlewares/errorHandler';
import { env } from '../../config/env';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

const SLIP_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
};

const ALLOWED_FOLDERS = new Set(['products', 'brands', 'categories', 'slips']);

function sanitizeFolder(rawFolder?: string): string {
  const cleaned = (rawFolder || 'products').trim().toLowerCase();
  return ALLOWED_FOLDERS.has(cleaned) ? cleaned : 'products';
}

/**
 * Inspects file magic bytes to verify the actual binary format matches an allowed image or PDF type.
 */
function detectMimeFromMagicBytes(buf: Buffer, allowPdf = false): string | null {
  if (
    allowPdf &&
    buf &&
    buf.length >= 5 &&
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46 && // F
    buf[4] === 0x2d    // -
  ) {
    return 'application/pdf';
  }
  if (!buf || buf.length < 12) {
    // Allow tiny valid 1x1 GIF/PNG buffers if at least 8 bytes
    if (
      buf &&
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return 'image/png';
    }
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return 'image/gif';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  // AVIF: "....ftypavif" or "....ftypavis"
  const boxType = buf.subarray(4, 12).toString('ascii');
  if (boxType === 'ftypavif' || boxType === 'ftypavis' || boxType.startsWith('ftypmif1')) {
    return 'image/avif';
  }

  return null;
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'INVALID_FILE_TYPE',
          `File type ${file.mimetype} is not allowed. Only JPG, PNG, WEBP, GIF, and AVIF images are supported.`,
          400
        )
      );
    }
  },
});

export const uploadSlipMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for bank slips & PDFs
  },
  fileFilter: (_req, file, cb) => {
    if ((SLIP_ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'INVALID_FILE_TYPE',
          `File type ${file.mimetype} is not allowed. Only JPG, PNG, WEBP images and PDF documents are supported for payment slips.`,
          400
        )
      );
    }
  },
});

/**
 * Handle public payment slip / PDF upload to Cloudflare R2
 */
export async function uploadPaymentSlip(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError('FILE_REQUIRED', 'Please upload a payment slip image or PDF receipt', 400);
    }

    const detectedMime = detectMimeFromMagicBytes(req.file.buffer, true);
    if (!detectedMime || !(SLIP_ALLOWED_MIME_TYPES as readonly string[]).includes(detectedMime)) {
      throw new AppError(
        'INVALID_FILE_TYPE',
        'Uploaded receipt is not a valid image or PDF file (failed file signature verification)',
        400
      );
    }

    const ext = MIME_TO_EXT[detectedMime] || 'jpg';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const key = `slips/${uniqueSuffix}.${ext}`;

    const uploaded = await uploadBufferToR2(req.file.buffer, key, detectedMime);

    res.status(201).json({
      data: {
        key: uploaded.key,
        url: uploaded.publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: detectedMime,
      },
    });
  } catch (error) {
    next(error);
  }
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

    const detectedMime = detectMimeFromMagicBytes(req.file.buffer);
    if (!detectedMime) {
      throw new AppError(
        'INVALID_FILE_TYPE',
        'Uploaded file content is not a valid image (failed magic-byte verification)',
        400
      );
    }

    const folder = sanitizeFolder(req.body.folder);
    const ext = MIME_TO_EXT[detectedMime] || 'jpg';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const key = `${folder}/${uniqueSuffix}.${ext}`;

    const uploaded = await uploadBufferToR2(req.file.buffer, key, detectedMime);

    res.status(201).json({
      data: {
        key: uploaded.key,
        url: uploaded.publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: detectedMime,
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

    const folder = sanitizeFolder(req.body.folder);

    const uploadPromises = files.map(async (file) => {
      const detectedMime = detectMimeFromMagicBytes(file.buffer);
      if (!detectedMime) {
        throw new AppError(
          'INVALID_FILE_TYPE',
          `File "${file.originalname}" is not a valid image`,
          400
        );
      }

      const ext = MIME_TO_EXT[detectedMime] || 'jpg';
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      const key = `${folder}/${uniqueSuffix}.${ext}`;

      const uploaded = await uploadBufferToR2(file.buffer, key, detectedMime);

      return {
        key: uploaded.key,
        url: uploaded.publicUrl,
        originalName: file.originalname,
        size: file.size,
        mimeType: detectedMime,
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

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(fileType)) {
      throw new AppError(
        'INVALID_FILE_TYPE',
        `File type ${fileType} is not allowed. Only JPG, PNG, WEBP, GIF, and AVIF images are supported.`,
        400
      );
    }

    // Derive extension strictly from verified MIME type, never from user-supplied fileName
    const ext = MIME_TO_EXT[fileType] || 'jpg';
    const cleanFolder = sanitizeFolder(folder);
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
    const rawKey = req.params[0] || (req.params as any).key;
    if (!rawKey) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
      return;
    }

    const key = decodeURIComponent(rawKey).replace(/^\/+/, '');
    if (key.includes('..')) {
      res.status(400).json({ error: { code: 'INVALID_KEY', message: 'Invalid media key' } });
      return;
    }

    // Restrict folder prefixes to allowed public media directories
    if (key.includes('/')) {
      const topFolder = key.split('/')[0].toLowerCase();
      if (!ALLOWED_FOLDERS.has(topFolder)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
        return;
      }
    }

    const media = await getR2ObjectStream(key);

    if (!media) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
      return;
    }

    const isAllowedImage = (ALLOWED_MIME_TYPES as readonly string[]).includes(media.contentType);
    const isAllowedSlipPdf = key.startsWith('slips/') && (media.contentType === 'application/pdf' || key.endsWith('.pdf'));
    const safeContentType = isAllowedImage
      ? media.contentType
      : isAllowedSlipPdf
        ? 'application/pdf'
        : 'application/octet-stream';

    res.setHeader('Content-Type', safeContentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
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
    if (!key || typeof key !== 'string' || key.includes('..')) {
      throw new AppError('KEY_REQUIRED', 'Valid object key is required to delete media', 400);
    }

    await deleteFromR2(key);

    res.json({
      data: { success: true, message: 'Media successfully deleted from Cloudflare R2' },
    });
  } catch (error) {
    next(error);
  }
}
