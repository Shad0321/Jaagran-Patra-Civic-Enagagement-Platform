# Backend Structure

This backend is organized into a clean, modular structure that separates concerns and makes the code easier to maintain and understand.

## Directory Structure

```
src/
├── config/
│   ├── database.ts      # Prisma client configuration
│   └── environment.ts   # Environment variables and configuration
├── middleware/
│   ├── security.ts      # Security-related middleware (helmet, cors, xss, etc.)
│   ├── validation.ts    # Input validation middleware
│   └── rateLimiting.ts  # Rate limiting configurations
├── routes/
│   └── index.ts         # API routes definition
├── app.ts               # Express app configuration
└── index.ts             # Server entry point
```

## Key Features

### Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **XSS Protection**: Input sanitization
- **Rate Limiting**: Request rate limiting
- **HPP**: HTTP Parameter Pollution protection
- **Input Validation**: Express validator integration

### Middleware Organization

- **Security**: All security-related middleware in one place
- **Validation**: Input validation and error handling
- **Rate Limiting**: Different rate limits for different route types

### Database

- **Prisma**: ORM with connection pooling
- **Graceful Shutdown**: Proper database connection cleanup

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file with:

   ```
   DATABASE_URL="your-database-url"
   PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS="http://localhost:3000"
   JWT_SECRET="your-secret-key"
   ```

3. **Set up Prisma**:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

## Available Endpoints

- `GET /health` - Server health check
- `GET /health/db` - Database connection health check
- `GET /example` - Example API endpoint

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `DATABASE_URL`: Database connection string
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins
- `JWT_SECRET`: Secret key for JWT tokens

## Development

The structure is designed to be:

- **Modular**: Each file has a single responsibility
- **Scalable**: Easy to add new routes, middleware, or configurations
- **Maintainable**: Clear separation of concerns
- **Secure**: Production-ready security configurations
