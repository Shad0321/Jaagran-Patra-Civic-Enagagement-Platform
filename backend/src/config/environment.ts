export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ],
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret:
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
} as const;

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
