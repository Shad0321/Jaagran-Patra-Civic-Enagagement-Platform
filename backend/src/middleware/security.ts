import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xss from 'xss';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import { config, isDevelopment } from '../config/environment';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});

// CORS configuration
export const corsConfig = cors({
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// XSS sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }

  // Also sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key] as string);
      }
    }
  }

  next();
};

// HTTP Parameter Pollution protection
export const parameterPollutionProtection = hpp();

// Compression middleware
export const compressionMiddleware = compression();

// HTTP request logger
export const requestLogger = morgan('combined');

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
};
