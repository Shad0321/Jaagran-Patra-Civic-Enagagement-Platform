import express from 'express';
import ZoomController from '../controllers/zoomController';
import { authenticate } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Validation middleware
const createInstantMeetingValidation = [
  body('topic').isString().trim().notEmpty().withMessage('Topic is required'),
  body('agenda').optional().isString().trim(),
];

const createScheduledMeetingValidation = [
  body('topic').isString().trim().notEmpty().withMessage('Topic is required'),
  body('agenda').optional().isString().trim(),
  body('startTime')
    .isISO8601()
    .toDate()
    .withMessage('Valid start time is required'),
  body('duration')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
  body('timezone').optional().isString().trim(),
  body('invitees').optional().isArray(),
  body('invitees.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email in invitees'),
  body('isOpenToAll').optional().isBoolean(),
  body('settings').optional().isObject(),
];

const createRecurringMeetingValidation = [
  body('topic').isString().trim().notEmpty().withMessage('Topic is required'),
  body('agenda').optional().isString().trim(),
  body('startTime')
    .isISO8601()
    .toDate()
    .withMessage('Valid start time is required'),
  body('duration')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
  body('recurrenceType')
    .isInt({ min: 1, max: 3 })
    .withMessage(
      'Recurrence type must be 1 (Daily), 2 (Weekly), or 3 (Monthly)'
    ),
  body('repeatInterval')
    .isInt({ min: 1 })
    .withMessage('Repeat interval must be at least 1'),
  body('endTimes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('End times must be at least 1'),
  body('endDateTime')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid end date time is required'),
  body('timezone').optional().isString().trim(),
  body('invitees').optional().isArray(),
  body('invitees.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email in invitees'),
  body('isOpenToAll').optional().isBoolean(),
  body('settings').optional().isObject(),
];

const meetingIdValidation = [
  param('meetingId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Meeting ID is required'),
];

const getUserMeetingsValidation = [
  query('type')
    .optional()
    .isIn(['all', 'upcoming', 'past', 'ongoing'])
    .withMessage('Invalid meeting type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const updateMeetingValidation = [
  param('meetingId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Meeting ID is required'),
  body('topic')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Topic cannot be empty'),
  body('agenda').optional().isString().trim(),
  body('startTime')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid start time is required'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
];

const inviteToMeetingValidation = [
  param('meetingId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Meeting ID is required'),
  body('invitees')
    .isArray()
    .notEmpty()
    .withMessage('Invitees list is required'),
  body('invitees.*').isEmail().withMessage('Invalid email in invitees'),
];

// Routes

/**
 * @route   POST /meetings/instant
 * @desc    Create an instant meeting
 * @access  Private (MLA only)
 */
router.post(
  '/instant',
  authenticate,
  createInstantMeetingValidation,
  handleValidationErrors,
  ZoomController.createInstantMeeting
);

/**
 * @route   POST /meetings/scheduled
 * @desc    Create a scheduled meeting
 * @access  Private (MLA only)
 */
router.post(
  '/scheduled',
  authenticate,
  createScheduledMeetingValidation,
  handleValidationErrors,
  ZoomController.createScheduledMeeting
);

/**
 * @route   POST /meetings/recurring
 * @desc    Create a recurring meeting
 * @access  Private (MLA only)
 */
router.post(
  '/recurring',
  authenticate,
  createRecurringMeetingValidation,
  handleValidationErrors,
  ZoomController.createRecurringMeeting
);

/**
 * @route   GET /meetings
 * @desc    Get all meetings for the authenticated user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  getUserMeetingsValidation,
  handleValidationErrors,
  ZoomController.getUserMeetings
);

/**
 * @route   GET /meetings/:meetingId
 * @desc    Get meeting details
 * @access  Private
 */
router.get(
  '/:meetingId',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.getMeetingDetails
);

/**
 * @route   PUT /meetings/:meetingId
 * @desc    Update meeting
 * @access  Private (Host only)
 */
router.put(
  '/:meetingId',
  authenticate,
  updateMeetingValidation,
  handleValidationErrors,
  ZoomController.updateMeeting
);

/**
 * @route   DELETE /meetings/:meetingId
 * @desc    Delete meeting
 * @access  Private (Host only)
 */
router.delete(
  '/:meetingId',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.deleteMeeting
);

/**
 * @route   POST /meetings/:meetingId/join
 * @desc    Join meeting
 * @access  Private
 */
router.post(
  '/:meetingId/join',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.joinMeeting
);

/**
 * @route   POST /meetings/:meetingId/end
 * @desc    End meeting
 * @access  Private (Host only)
 */
router.post(
  '/:meetingId/end',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.endMeeting
);

/**
 * @route   GET /meetings/:meetingId/participants
 * @desc    Get meeting participants
 * @access  Private
 */
router.get(
  '/:meetingId/participants',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.getMeetingParticipants
);

/**
 * @route   GET /meetings/:meetingId/invitations
 * @desc    Get meeting invitations
 * @access  Private
 */
router.get(
  '/:meetingId/invitations',
  authenticate,
  meetingIdValidation,
  handleValidationErrors,
  ZoomController.getMeetingInvitations
);

/**
 * @route   POST /meetings/:meetingId/invite
 * @desc    Invite users to meeting
 * @access  Private (Host only)
 */
router.post(
  '/:meetingId/invite',
  authenticate,
  inviteToMeetingValidation,
  handleValidationErrors,
  ZoomController.inviteToMeeting
);

export default router;
