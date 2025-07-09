import express from 'express';
import dotenv from 'dotenv';
import {
  securityHeaders,
  corsConfig,
  sanitizeInput,
  parameterPollutionProtection,
  compressionMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
} from './middleware/security';
import { generalLimiter } from './middleware/rateLimiting';
import routes from './routes';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Apply middleware in order
app.use(compressionMiddleware);
app.use(securityHeaders);
app.use(cors());
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional security middleware
app.use(parameterPollutionProtection);
app.use(sanitizeInput);
app.use(requestLogger);

// Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
