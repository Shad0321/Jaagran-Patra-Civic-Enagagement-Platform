import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler } from '../middleware/validation';
import authRoutes from './auth';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Database health check
router.get('/health/db', asyncHandler(async (req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
        success: true,
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString(),
    });
}));

// Example API endpoint
router.get('/api/example', asyncHandler(async (req: Request, res: Response) => {
    // Example database query - replace with your actual data model
    // const data = await prisma.yourModel.findMany();
    
    res.json({
        success: true,
        message: 'Example endpoint working',
        data: [],
    });
}));

export default router;
