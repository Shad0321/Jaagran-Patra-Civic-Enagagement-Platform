require('dotenv').config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret:
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  zoom: {
    masterUserId: process.env.ZOOM_MASTER_USER_ID || 'me', // Use 'me' for the account owner
  },
} as const;

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
