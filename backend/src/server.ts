import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 ShiftLK Backend REST API listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 Health check: http://localhost:${env.PORT}/health`);
  console.log(`📦 API Root: http://localhost:${env.PORT}/api/v1`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connection disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcefully terminating server.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
