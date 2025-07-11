import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  addIssueUpdate,
  getIssueStats,
  deleteIssue,
} from '../controllers/issueController';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Routes

/**
 * @route   POST /api/issues
 * @desc    Create a new issue (MLA only)
 * @access  Private (MLA only)
 * @body    {
 *            title: string,
 *            description: string,
 *            category: string,
 *            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
 *            isUrgent?: boolean,
 *            assignedToId?: string,
 *            address?: string,
 *            latitude?: number,
 *            longitude?: number,
 *            stateId: string,
 *            districtId?: string,
 *            constituencyId?: string,
 *            bodyId?: string,
 *            voiceNote?: string,
 *            images?: string (JSON array)
 *          }
 */
router.post(
  '/',
  authenticate,
  authorize(['MLA']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    body('isUrgent')
      .optional()
      .isBoolean()
      .withMessage('isUrgent must be boolean'),
    body('stateId').notEmpty().withMessage('State ID is required'),
    body('districtId').optional().isString(),
    body('constituencyId').optional().isString(),
    body('bodyId').optional().isString(),
    body('assignedToId').optional().isString(),
    body('address').optional().isString(),
    body('latitude')
      .optional()
      .isFloat()
      .withMessage('Latitude must be a number'),
    body('longitude')
      .optional()
      .isFloat()
      .withMessage('Longitude must be a number'),
    body('voiceNote').optional().isString(),
    body('images').optional().isString(), // JSON string
  ],
  handleValidationErrors,
  createIssue
);

/**
 * @route   GET /api/issues
 * @desc    Get all issues for the authenticated user
 * @access  Private
 * @query   {
 *            status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
 *            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
 *            category?: string,
 *            page?: number,
 *            limit?: number,
 *            search?: string
 *          }
 */
router.get(
  '/',
  authenticate,
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    query('category').optional().isString(),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  getIssues
);

/**
 * @route   GET /api/issues/stats
 * @desc    Get issue statistics for dashboard
 * @access  Private
 */
router.get('/stats', authenticate, getIssueStats);

/**
 * @route   GET /api/issues/:id
 * @desc    Get a specific issue with all details
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isString().notEmpty().withMessage('Issue ID is required')],
  handleValidationErrors,
  getIssueById
);

/**
 * @route   PUT /api/issues/:id
 * @desc    Update an issue (assign, reassign, change priority, etc.)
 * @access  Private (MLA, MEMBER, ADMIN)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['MLA', 'MEMBER', 'ADMIN']),
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description')
      .optional()
      .notEmpty()
      .withMessage('Description cannot be empty'),
    body('category')
      .optional()
      .notEmpty()
      .withMessage('Category cannot be empty'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    body('isUrgent')
      .optional()
      .isBoolean()
      .withMessage('isUrgent must be boolean'),
    body('assignedToId').optional().isString(),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('Invalid status'),
    body('expectedResolutionDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('resolutionNotes').optional().isString(),
  ],
  handleValidationErrors,
  updateIssue
);

/**
 * @route   POST /api/issues/:id/updates
 * @desc    Add an update/comment to an issue
 * @access  Private
 * @body    {
 *            message?: string,
 *            status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
 *            updateType?: 'MEMBER_UPDATE' | 'CITIZEN_COMMENT' | 'STATUS_CHANGE' | 'ASSIGNMENT',
 *            mediaType?: 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT',
 *            audioUrl?: string,
 *            imageUrls?: string[],
 *            hoursWorked?: number,
 *            progressPercentage?: number,
 *            nextSteps?: string
 *          }
 */
router.post(
  '/:id/updates',
  authenticate,
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('message')
      .optional()
      .notEmpty()
      .withMessage('Message cannot be empty'),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('Invalid status'),
    body('updateType')
      .optional()
      .isIn(['MEMBER_UPDATE', 'CITIZEN_COMMENT', 'STATUS_CHANGE', 'ASSIGNMENT'])
      .withMessage('Invalid update type'),
    body('mediaType')
      .optional()
      .isIn(['TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT'])
      .withMessage('Invalid media type'),
    body('audioUrl').optional().isString(),
    body('imageUrls').optional().isArray(),
    body('hoursWorked')
      .optional()
      .isFloat()
      .withMessage('Hours worked must be a number'),
    body('progressPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be between 0 and 100'),
    body('nextSteps').optional().isString(),
  ],
  handleValidationErrors,
  addIssueUpdate
);

/**
 * @route   DELETE /api/issues/:id
 * @desc    Delete an issue
 * @access  Private (ADMIN, MLA who created it)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MLA']),
  [param('id').isString().notEmpty().withMessage('Issue ID is required')],
  handleValidationErrors,
  deleteIssue
);

export default router;
