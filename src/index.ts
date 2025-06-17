import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from '@/config/environment';
import { logger } from '@/config/logger';
import { requestLogger } from '@/middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { handleMulterError } from '@/middlewares/upload.middleware';
import { FileService } from '@/services/file.service';
import { EmailService } from '@/services/email.service';
import routes from '@/routes';

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize upload directories
    await FileService.initializeDirectories();
    logger.info('File service initialized');

    // Initialize email service
    await EmailService.initialize();
    logger.info('Email service initialized');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

const app = express();

// Initialize services
initializeServices();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Logging middleware
app.use(requestLogger);

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(handleMulterError);
app.use(notFoundHandler);
app.use(errorHandler);

// Function to start the server
export const startServer = (port?: number) => {
  const serverPort = port || env.PORT;
  return app.listen(serverPort, () => {
    logger.info(`🚀 Server running on http://localhost:${serverPort}`);
    logger.info(`📚 API Documentation: http://localhost:${serverPort}/api/health`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });
};

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  startServer();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

export default app;
