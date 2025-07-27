import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
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
import meetingReminderService from './services/meetingReminderService';
import cors from 'cors';
import { config } from './config/environment';
// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Apply middleware in order
app.use(compressionMiddleware);
app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional security middleware
app.use(parameterPollutionProtection);
app.use(sanitizeInput);
app.use(requestLogger);

// Serve static files from uploads directory with proper CORS headers
app.use(
  '/uploads',
  (req, res, next) => {
    // Set CORS headers for all requests to uploads
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Range'
    );
    res.header(
      'Access-Control-Expose-Headers',
      'Content-Range, Accept-Ranges, Content-Length'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

app.get('/', (req, res) => {
  res.send('API is running');
});
// Routes
app.use('/api', routes);

// Start meeting reminder service
if (process.env.NODE_ENV !== 'test') {
  meetingReminderService.start();
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
