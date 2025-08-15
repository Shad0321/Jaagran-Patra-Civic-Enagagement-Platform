// routes/chat.ts
import { Router } from 'express';
import {
  createGroup,
  getGroups,
  getPublicGroups,
  getGroupMessages,
  joinGroup,
  leaveGroup,
  inviteMember,
  removeMember,
  getGroupMembers,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Apply authentication to all chat routes
router.use(authenticate);

// Validation middleware
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name is required and must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .isIn(['PUBLIC_MLA_GROUP', 'PRIVATE_MLA_GROUP'])
    .withMessage('Invalid group type'),
  handleValidationErrors,
];

const sendMessageValidation = [
  param('groupId').isString().withMessage('Group ID is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message is required and must be less than 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['TEXT', 'IMAGE', 'AUDIO', 'FILE'])
    .withMessage('Invalid message type'),
  handleValidationErrors,
];

const inviteMemberValidation = [
  param('groupId').isString().withMessage('Group ID is required'),
  body('userId').isString().withMessage('User ID is required'),
  handleValidationErrors,
];

const groupIdValidation = [
  param('groupId').isString().withMessage('Group ID is required'),
  handleValidationErrors,
];

// Routes

// Create a new chat group (Only MLAs can create groups)
router.post('/groups', createGroupValidation, createGroup);

// Get all groups for the authenticated user (includes member groups and available public groups)
router.get('/groups', getGroups);

// Get only public groups available for joining
router.get('/groups/public', getPublicGroups);

// Get messages for a specific group
router.get('/groups/:groupId/messages', groupIdValidation, getGroupMessages);

// Send a message to a group
// router.post('/groups/:groupId/messages', sendMessageValidation, sendMessage);

// Join a public group
router.post('/groups/:groupId/join', groupIdValidation, joinGroup);

// Leave a group
router.post('/groups/:groupId/leave', groupIdValidation, leaveGroup);

// Invite a member to a group (Only MLA or authorized members)
router.post('/groups/:groupId/invite', inviteMemberValidation, inviteMember);

// Remove a member from a group (Only MLA or authorized members)
router.delete(
  '/groups/:groupId/members/:userId',
  [
    param('groupId').isString().withMessage('Group ID is required'),
    param('userId').isString().withMessage('User ID is required'),
    handleValidationErrors,
  ],
  removeMember
);

// Get group members
router.get('/groups/:groupId/members', groupIdValidation, getGroupMembers);

// Mark message as read
// router.post(
//   '/messages/:messageId/read',
//   [
//     param('messageId').isString().withMessage('Message ID is required'),
//     handleValidationErrors,
//   ],
//   markMessageAsRead
// );

export default router;
