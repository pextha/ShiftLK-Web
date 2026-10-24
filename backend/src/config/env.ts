import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load environment variables from .env file (checking backend directory first, then monorepo root)
const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

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
  // Cloudflare R2 Object Storage (Loaded from .env)
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required in .env'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required in .env'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required in .env'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required in .env'),
  R2_PUBLIC_DOMAIN: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
