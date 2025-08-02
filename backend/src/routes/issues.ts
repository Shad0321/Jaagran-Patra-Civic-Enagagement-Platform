import { Router } from 'express';
import { Response } from 'express';
import {
  authenticate,
  authorize,
  AuthenticatedRequest,
} from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { uploadIssueFiles, handleUploadError } from '../middleware/upload';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  addIssueUpdate,
  getIssueStats,
  deleteIssue,
  getAssignedIssues,
  getMyIssues,
  updateIssueProgress,
  getNearbyIssues,
} from '../controllers/issueController';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const prisma = new PrismaClient();
const router = Router();

// Routes

/**
 * @route   GET /issues/stats
 * @desc    Get issue statistics
 * @access  Private
 */
router.get('/stats', authenticate, getIssueStats);

/**
 * @route   GET /issues/nearby
 * @desc    Get nearby issues (public route)
 * @access  Public
 */
router.get(
  '/nearby',
  [
    query('latitude')
      .notEmpty()
      .isFloat()
      .withMessage('Valid latitude is required'),
    query('longitude')
      .notEmpty()
      .isFloat()
      .withMessage('Valid longitude is required'),
    query('radius').optional().isFloat().withMessage('Radius must be Float'),
    query('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'])
      .withMessage('Invalid status'),
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    query('category').optional().isString().trim(),
    query('search').optional().isString().trim(),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  getNearbyIssues
);

/**
 * @route   GET /issues/assigned-to-me
 * @desc    Get issues assigned to the current user (MLAs and Members)
 * @access  Private (MLA, MEMBER)
 */
router.get(
  '/assigned-to-me',
  authenticate,
  authorize(['MLA', 'MEMBER']),
  getAssignedIssues
);

/**
 * @route   GET /issues/my-issues
 * @desc    Get issues reported by the current user (Citizens)
 * @access  Private (CITIZEN)
 */
router.get('/my-issues', authenticate, authorize(['CITIZEN']), getMyIssues);

/**
 * @route   GET /issues/:id
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
 * @route   POST /issues
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
 * @route   GET /issues
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
 * @route   GET /issues/stats
 * @desc    Get issue statistics for dashboard
 * @access  Private
 */
router.get('/stats', authenticate, getIssueStats);

/**
 * @route   GET /issues/:id
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
 * @route   PUT /issues/:id
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
    body('assignedToId')
      .optional()
      .custom((value) => {
        if (
          value === null ||
          value === undefined ||
          typeof value === 'string'
        ) {
          return true;
        }
        throw new Error('assignedToId must be a string or null');
      }),
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
 * @route   POST /issues/:id/updates
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
 * @route   DELETE /issues/:id
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

/**
 * @route   POST /issues/citizen
 * @desc    Create a new issue (CITIZEN only)
 * @access  Private (CITIZEN only)
 * @body    {
 *            title: string,
 *            description: string,
 *            category: string,
 *            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
 *            address?: string,
 *            latitude?: number,
 *            longitude?: number,
 *            stateId: string,
 *            constituencyId?: string,
 *            bodyId?: string,
 *            voiceNote?: string,
 *            images?: string (JSON array)
 *          }
 */
router.post(
  '/citizen',
  authenticate,
  authorize(['CITIZEN']),
  uploadIssueFiles,
  handleUploadError,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
    body('stateId').notEmpty().withMessage('State ID is required'),
    body('constituencyId').optional().isString(),
    body('bodyId').optional().isString(),
    body('address').optional().isString(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
  ],
  handleValidationErrors,
  createIssue
);

/**
 * @route   GET /issues/citizen/my-issues
 * @desc    Get all issues created by the authenticated citizen
 * @access  Private (CITIZEN only)
 */
router.get(
  '/citizen/my-issues',
  authenticate,
  authorize(['CITIZEN']),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    query('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    query('category').optional().isString(),
  ],
  handleValidationErrors,
  getIssues
);

/**
 * @route   GET /issues/citizen/nearby-bodies
 * @desc    Get nearby bodies for issue assignment
 * @access  Private (CITIZEN only)
 */
router.get(
  '/citizen/nearby-bodies',
  authenticate,
  authorize(['CITIZEN', 'MLA', 'MEMBER']),
  [
    query('stateId').notEmpty().withMessage('State ID is required'),
    query('constituencyId').optional().isString(),
    query('latitude').optional().isFloat(),
    query('longitude').optional().isFloat(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stateId, constituencyId, latitude, longitude } = req.query;

      const bodies = await prisma.body.findMany({
        where: {
          stateId: stateId as string,
          constituencyId: constituencyId
            ? (constituencyId as string)
            : undefined,
        },
        include: {
          constituency: {
            select: { name: true, type: true },
          },
          state: {
            select: { name: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: bodies,
      });
    } catch (error) {
      console.error('Error fetching nearby bodies:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * @route   POST /issues/citizen/:id/comment
 * @desc    Add a comment to an issue (CITIZEN only)
 * @access  Private (CITIZEN only)
 */
router.post(
  '/citizen/:id/comment',
  authenticate,
  authorize(['CITIZEN']),
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('message').notEmpty().withMessage('Comment message is required'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user!.id;

      // Verify issue exists and user is the reporter
      const issue = await prisma.issue.findUnique({
        where: { id },
        include: { reportedBy: true },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      if (issue.reportedById !== userId) {
        res
          .status(403)
          .json({ error: 'You can only comment on your own issues' });
        return;
      }

      const update = await prisma.issueUpdate.create({
        data: {
          issueId: id,
          userId,
          message,
          updateType: 'CITIZEN_COMMENT',
          mediaType: 'TEXT',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        update,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

/**
 * @route   GET /issues/citizen/:id/details
 * @desc    Get detailed issue information including updates (CITIZEN only)
 * @access  Private (CITIZEN only)
 */
router.get(
  '/citizen/:id/details',
  authenticate,
  authorize(['CITIZEN']),
  [param('id').isString().notEmpty().withMessage('Issue ID is required')],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              mlaProfile: {
                select: {
                  partyName: true,
                  position: true,
                  contactEmail: true,
                  contactPhone: true,
                },
              },
            },
          },
          state: {
            select: {
              id: true,
              name: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
            },
          },
          constituency: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          body: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          updates: {
  select: {
    id: true,
    issueId: true,
    userId: true,
    message: true,
    status: true,
    updateType: true,
    mediaType: true,
    audioUrl: true,
    imageUrls: true,
    attachments: true,
    hoursWorked: true,
    progressPercentage: true,
    nextSteps: true,
    createdAt: true,
    user: {  // Include user data using select
      select: {
        id: true,
        name: true,
        role: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
},
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Check if user is the reporter
      if (issue.reportedById !== userId) {
        res.status(403).json({ error: 'You can only view your own issues' });
        return;
      }

      res.json({
        success: true,
        issue,
      });
    } catch (error) {
      console.error('Error fetching issue details:', error);
      res.status(500).json({ error: 'Failed to fetch issue details' });
    }
  }
);

/**
 * @route   POST /issues/:id/progress
 * @desc    Add progress update to an issue (MLA/MEMBER only)
 * @access  Private (MLA/MEMBER only)
 */
router.post(
  '/:id/progress',
  authenticate,
  authorize(['MLA', 'MEMBER']),
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('message').notEmpty().withMessage('Progress message is required'),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
    body('progressPercentage').optional().isInt({ min: 0, max: 100 }),
    body('hoursWorked').optional().isFloat({ min: 0 }),
    body('nextSteps').optional().isString(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message, status, progressPercentage, hoursWorked, nextSteps } =
        req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verify issue exists and user has permission to update
      const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
          reportedBy: true,
          assignedTo: true,
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Check permissions
      const canUpdate =
        (userRole === 'MLA' &&
          (issue.reportedById === userId || issue.assignedToId === userId)) ||
        (userRole === 'MEMBER' && issue.assignedToId === userId);

      if (!canUpdate) {
        res
          .status(403)
          .json({ error: 'You are not authorized to update this issue' });
        return;
      }

      // Create the progress update
      const updateData: any = {
        issueId: id,
        userId,
        message,
        updateType: 'MEMBER_UPDATE',
        mediaType: 'TEXT',
      };

      if (status) updateData.status = status;
      if (progressPercentage !== undefined)
        updateData.progressPercentage = progressPercentage;
      if (hoursWorked !== undefined) updateData.hoursWorked = hoursWorked;
      if (nextSteps) updateData.nextSteps = nextSteps;

      const update = await prisma.issueUpdate.create({
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Update issue status if provided
      if (status) {
        await prisma.issue.update({
          where: { id },
          data: {
            status,
            ...(status === 'RESOLVED' && { actualResolutionDate: new Date() }),
          },
        });
      }

      res.status(201).json({
        success: true,
        message: 'Progress update added successfully',
        update,
      });
    } catch (error) {
      console.error('Error adding progress update:', error);
      res.status(500).json({ error: 'Failed to add progress update' });
    }
  }
);

/**
 * @route   GET /issues/assigned-to-me
 * @desc    Get issues assigned to the current user (MLAs and Members)
 * @access  Private (MLA, MEMBER)
 */
router.get(
  '/assigned-to-me',
  authenticate,
  authorize(['MLA', 'MEMBER']),
  getAssignedIssues
);

/**
 * @route   GET /issues/my-issues
 * @desc    Get issues reported by the current user (Citizens)
 * @access  Private (CITIZEN)
 */
router.get('/my-issues', authenticate, authorize(['CITIZEN']), getMyIssues);

/**
 * @route   PUT /issues/:id/update-progress
 * @desc    Update issue progress (for MLAs and Members)
 * @access  Private (MLA, MEMBER)
 */
router.put(
  '/:id/update-progress',
  authenticate,
  authorize(['MLA', 'MEMBER']),
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('progressUpdate')
      .isString()
      .notEmpty()
      .withMessage('Progress update is required'),
    body('status')
      .optional()
      .isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED'])
      .withMessage('Invalid status'),
    body('estimatedCompletion')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('progressPercentage')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress percentage must be between 0 and 100'),
    body('hoursWorked')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Hours worked must be positive'),
    body('nextSteps')
      .optional()
      .isString()
      .withMessage('Next steps must be a string'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Invalid priority'),
  ],
  handleValidationErrors,
  updateIssueProgress
);

/**
 * @route   POST /issues/citizen/:id/nearby-comment
 * @desc    Add a comment to a nearby issue (CITIZEN and MEMBER)
 * @access  Private (CITIZEN and MEMBER)
 */
router.post(
  '/citizen/:id/nearby-comment',
  authenticate,
  authorize(['CITIZEN', 'MEMBER']),
  [
    param('id').isString().notEmpty().withMessage('Issue ID is required'),
    body('message').notEmpty().withMessage('Comment message is required'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user!.id;

      // Verify issue exists
      const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
          reportedBy: true,
          state: true,
          district: true,
          constituency: true,
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Get the commenting user's details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          state: true,
          district: true,
          constituency: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if the user is from the same general area (same state/district)
      // Allow commenting if they're from the same area OR if it's their own issue
      // const canComment =
      //   issue.reportedById === userId || // Own issue
      //   (user.stateId === issue.stateId && user.districtId === issue.districtId); // Same area

      // if (!canComment) {
      //   res.status(403).json({ error: 'You can only comment on issues from your area' });
      //   return;
      // }

      const update = await prisma.issueUpdate.create({
        data: {
          issueId: id,
          userId,
          message,
          updateType: 'CITIZEN_COMMENT',
          mediaType: 'TEXT',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        update,
      });
    } catch (error) {
      console.error('Error adding nearby comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }
);

/**
 * @route   GET /issues/nearby/:id/details
 * @desc    Get detailed nearby issue information including updates (CITIZEN and MEMBER)
 * @access  Private (CITIZEN and MEMBER)
 */
router.get(
  '/nearby/:id/details',
  authenticate,
  authorize(['CITIZEN', 'MEMBER', 'MLA']),
  [param('id').isString().notEmpty().withMessage('Issue ID is required')],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const issue = await prisma.issue.findUnique({
        where: { id },
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              mlaProfile: {
                select: {
                  partyName: true,
                  position: true,
                  contactEmail: true,
                  contactPhone: true,
                },
              },
            },
          },
          state: {
            select: {
              id: true,
              name: true,
            },
          },
          district: {
            select: {
              id: true,
              name: true,
            },
          },
          constituency: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          body: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          updates: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Get the requesting user's details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          state: true,
          district: true,
          constituency: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if the user is from the same general area (same state/district)
      // Allow access if they're from the same area OR if it's their own issue
      // const canAccess =
      //   issue.reportedById === userId || // Own issue
      //   (user.stateId === issue.stateId && user.districtId === issue.districtId); // Same area

      // if (!canAccess) {
      //   res.status(403).json({ error: 'You can only view issues from your area' });
      //   return;
      // }

      res.json({
        success: true,
        issue,
      });
    } catch (error) {
      console.error('Error fetching nearby issue details:', error);
      res.status(500).json({ error: 'Failed to fetch issue details' });
    }
  }
);

export default router;
