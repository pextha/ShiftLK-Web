import rateLimit from 'express-rate-limit';

// Global public API limiter (200 requests per minute)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again in a moment.',
    },
  },
});

// Strict limiter for public order placements (15 requests per 15 minutes)
export const orderPlacementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'ORDER_RATE_LIMIT_EXCEEDED',
      message: 'Too many order requests from this IP. Please wait before placing another order.',
    },
  },
});

// Limiter for order lookups (30 lookups per 15 minutes)
export const orderLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'LOOKUP_RATE_LIMIT_EXCEEDED',
      message: 'Too many lookup requests. Please wait a moment and try again.',
    },
  },
});

// Limiter for Admin Authentication (10 attempts per 15 minutes)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    },
  },
});
