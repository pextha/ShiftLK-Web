import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  ADMIN_ORIGIN: z.string().default('http://localhost:3001'),
  COOKIE_DOMAIN: z.string().optional(),
  LOCKOUT_MAX_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_MINUTES: z.coerce.number().default(10),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  INITIAL_ADMIN_EMAIL: z.string().email().default('admin@shiftlk.lk'),
  INITIAL_ADMIN_PASSWORD: z.string().default('ShiftAdmin@2026'),
  INITIAL_ADMIN_NAME: z.string().default('ShiftLK Administrator'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
  // Cloudflare R2 Object Storage
  R2_ACCOUNT_ID: z.string().default('09736e0d4fd96671bf522a0bbb9a8efb'),
  R2_ACCESS_KEY_ID: z.string().default('ca0b1d7e1436eefbdf83a9be99ddd907'),
  R2_SECRET_ACCESS_KEY: z.string().default('db9b4ce6a6093d8ed4aad708baef39a14719cbed9242e911bedb00e1d16b0568'),
  R2_BUCKET_NAME: z.string().default('shiftlk-dev-media'),
  R2_PUBLIC_DOMAIN: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
