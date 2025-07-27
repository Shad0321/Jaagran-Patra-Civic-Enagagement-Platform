import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler } from '../middleware/validation';
import authRoutes from './auth';
import issueRoutes from './issues';
import adminRoutes from './admin';
import notificationRoutes from './notifications';
import mapRoutes from './map';
import newsRoutes from './news';
import analyticsRoutes from './analytics';
import meetingRoutes from './meetings';
import chatRoutes from './chat';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Issue routes
router.use('/issues', issueRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Map routes
router.use('/map', mapRoutes);

// News routes (public)
router.use('/news', newsRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Meeting routes
router.use('/meetings', meetingRoutes);

// Chat routes - Add this line
router.use('/chat', chatRoutes);

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Database health check
router.get(
  '/health/db',
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
