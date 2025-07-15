# JagranPatra Issue Management - Quick Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn
- Git

## 1. Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `jagranpatra`
3. Create a user with full permissions

### Option B: Cloud Database (Recommended)

1. Sign up for [Neon](https://neon.tech) (free tier available)
2. Create a new database
3. Copy the connection string

## 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jagranpatra"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRY_TIME="7d"

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=yourpassword
SMTP_FROM=Your Name <your@email.com>

# Server
PORT=5000
NODE_ENV="development"
```

## 3. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd jp-web-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 4. Database Migration

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

## 5. Seed Data (Optional)

Create initial data for testing:

```bash
# Create seed script
node scripts/seed.js
```

Example seed script (`backend/scripts/seed.js`):

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create a state
  const state = await prisma.state.create({
    data: {
      name: 'Sample State',
      code: 'SS',
    },
  });

  // Create a district
  const district = await prisma.district.create({
    data: {
      name: 'Sample District',
      code: 'SD',
      stateId: state.id,
    },
  });

  // Create a constituency
  const constituency = await prisma.constituency.create({
    data: {
      name: 'Sample Constituency',
      code: 'SC',
      type: 'Assembly',
      stateId: state.id,
      districtId: district.id,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jagranpatra.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      stateId: state.id,
    },
  });

  // Create MLA user
  const mlaPassword = await bcrypt.hash('mla123', 10);
  const mla = await prisma.user.create({
    data: {
      email: 'mla@jagranpatra.com',
      name: 'Sample MLA',
      password: mlaPassword,
      role: 'MLA',
      isVerified: true,
      stateId: state.id,
      districtId: district.id,
      constituencyId: constituency.id,
      mlaProfile: {
        create: {
          constituencyId: constituency.id,
          partyName: 'Sample Party',
          position: 'MLA',
          contactEmail: 'mla@jagranpatra.com',
        },
      },
    },
  });

  // Create a body
  const body = await prisma.body.create({
    data: {
      name: 'Sample Shakti Kendra',
      code: 'SSK001',
      type: 'SHAKTI_KENDRA',
      stateId: state.id,
      districtId: district.id,
      constituencyId: constituency.id,
    },
  });

  // Create member user
  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.create({
    data: {
      email: 'member@jagranpatra.com',
      name: 'Sample Member',
      password: memberPassword,
      role: 'MEMBER',
      isVerified: true,
      stateId: state.id,
      districtId: district.id,
      constituencyId: constituency.id,
      bodyId: body.id,
      mlaId: mla.id,
      memberProfile: {
        create: {
          bodyType: 'SHAKTI_KENDRA',
          designation: 'Shakti Kendra Head',
        },
      },
    },
  });

  console.log('Seed data created successfully!');
  console.log({
    admin: { email: 'admin@jagranpatra.com', password: 'admin123' },
    mla: { email: 'mla@jagranpatra.com', password: 'mla123' },
    member: { email: 'member@jagranpatra.com', password: 'member123' },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 6. Start the Application

### Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## 7. API Testing

### Using Postman/Thunder Client

1. **Login as Admin**:

```bash
POST http://localhost:5000/auth/login
Content-Type: application/json

{
  "email": "admin@jagranpatra.com",
  "password": "admin123"
}
```

2. **Create an Issue (as MLA)**:

```bash
POST http://localhost:5000/issues
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Street light not working",
  "description": "The street light on Main Road is not working since last week",
  "category": "Infrastructure",
  "priority": "MEDIUM",
  "stateId": "YOUR_STATE_ID",
  "assignedToId": "YOUR_MEMBER_ID"
}
```

3. **Get Issues**:

```bash
GET http://localhost:5000/issues
Authorization: Bearer YOUR_JWT_TOKEN
```

4. **Add Issue Update**:

```bash
POST http://localhost:5000/issues/ISSUE_ID/updates
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Work started on the street light repair",
  "status": "IN_PROGRESS",
  "updateType": "MEMBER_UPDATE",
  "progressPercentage": 50
}
```

## 8. Common Issues & Solutions

### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
echo $DATABASE_URL
```

### Permission Errors

```bash
# Fix file permissions
chmod +x scripts/seed.js

# Fix npm permissions
npm config set prefix ~/.npm-global
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: This will delete all data)
npx prisma migrate reset
```

## 9. Development Workflow

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to update database
3. Run `npm run db:generate` to update Prisma client
4. Restart the application

### Adding New Features

1. Create new routes in `src/routes/`
2. Create controllers in `src/controllers/`
3. Add validation in route files
4. Test with Postman/Thunder Client
5. Update documentation

## 10. Production Deployment

### Backend (Node.js)

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

### Frontend (React)

```bash
# Build for production
npm run build

# Serve static files
npm run preview
```

### Environment Variables for Production

```bash
NODE_ENV=production
DATABASE_URL=your-production-db-url
JWT_SECRET=your-production-jwt-secret
PORT=5000
```

## 11. Monitoring & Logs

### View Application Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Database logs
tail -f /var/log/postgresql/postgresql-13-main.log
```

### Performance Monitoring

- Use `npm run db:studio` to monitor database
- Check API response times in browser dev tools
- Monitor memory usage with `htop` or `pm2 monit`

## 12. Backup & Recovery

### Database Backup

```bash
# Create backup
pg_dump -U username -h localhost jagranpatra > backup.sql

# Restore backup
psql -U username -h localhost jagranpatra < backup.sql
```

### Regular Maintenance

- Monitor database size
- Clean up old logs
- Update dependencies regularly
- Monitor security vulnerabilities

---

## Quick Test Commands

```bash
# Health check
curl http://localhost:5000/health

# Register a citizen
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jagranpatra.com","password":"admin123"}'
```

This setup guide should get you up and running with the JagranPatra Issue Management System. For more detailed information, refer to the `ISSUE_API.md` and `SYSTEM_ARCHITECTURE.md` documents.
