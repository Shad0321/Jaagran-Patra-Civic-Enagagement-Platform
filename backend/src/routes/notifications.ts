import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationCount,
} from '../controllers/notificationController';

const router = express.Router();

// Get notifications for authenticated user
router.get('/', authenticate, getNotifications);

// Get notification count
router.get('/count', authenticate, getNotificationCount);

// Mark notification as read
router.patch('/:notificationId/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, markAllAsRead);

export default router;
