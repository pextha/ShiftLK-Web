import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler, AppError } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { swaggerSpec } from './docs/swagger';

// Public Module Routes
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import brandsRoutes from './modules/brands/brands.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import ordersRoutes from './modules/orders/orders.routes';

import adminAuthRoutes from './modules/auth/auth.routes';
import adminCategoriesRoutes from './modules/categories/admin.categories.routes';
import adminProductsRoutes from './modules/products/admin.products.routes';
import adminOrdersRoutes from './modules/orders/admin.orders.routes';
import adminExpensesRoutes from './modules/expenses/expenses.routes';
import adminAnalyticsRoutes from './modules/analytics/analytics.routes';
import adminAuditRoutes from './modules/audit/audit.routes';
import adminUsersRoutes from './modules/users/users.routes';
import adminSettingsRoutes from './modules/settings/settings.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';

const app = express();

// Security & headers
app.use(helmet({
  contentSecurityPolicy: false, // Allows Swagger UI assets
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  env.ADMIN_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      try {
        const url = new URL(origin);
        if (url.hostname === 'shiftlk.lk' || url.hostname.endsWith('.shiftlk.lk')) {
          return callback(null, true);
        }
      } catch {}
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url?.startsWith('/api/docs'),
      },
    })
  );
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiter for API
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API v1 Public Routes
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/brands', brandsRoutes);
app.use('/api/v1/delivery-zones', deliveryRoutes);
app.use('/api/v1/orders', ordersRoutes);

// API v1 Admin Routes
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/categories', adminCategoriesRoutes);
app.use('/api/v1/admin/products', adminProductsRoutes);
app.use('/api/v1/admin/orders', adminOrdersRoutes);
app.use('/api/v1/admin/expenses', adminExpensesRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin/audit-logs', adminAuditRoutes);
app.use('/api/v1/admin/users', adminUsersRoutes);
app.use('/api/v1/admin/settings', adminSettingsRoutes);
app.use('/api/v1', uploadsRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response, next) => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404));
});

// Centralized error handler
app.use(errorHandler);

export default app;
