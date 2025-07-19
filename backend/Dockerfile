# Use Node.js 18 LTS (Debian-based)
FROM node:18-slim

# Set working directory
WORKDIR /app

# Set env for Prisma engine issues
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Install dependencies for Prisma + Healthcheck
RUN apt-get update && \
    apt-get install -y curl openssl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client with correct binary target
RUN npx prisma generate

# Copy source code
COPY src ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Create uploads directories
RUN mkdir -p uploads/audio uploads/images

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["npm", "start"]
