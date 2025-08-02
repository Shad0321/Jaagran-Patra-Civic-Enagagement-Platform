import express from 'express';
import * as authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Public routes
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
  ],
  handleValidationErrors,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  authController.login
);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Password reset routes
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  handleValidationErrors,
  authController.initiatePasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  handleValidationErrors,
  authController.completePasswordReset
);

// Email verification routes
router.post(
  '/resend-verification-email',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  handleValidationErrors,
  authController.resendVerificationEmail
);

router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('token').notEmpty().withMessage('Verification token is required'),
  ],
  handleValidationErrors,
  authController.verifyEmail
);

// Phone verification routes
router.post(
  '/send-phone-verification',
  authLimiter,
  [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
  ],
  handleValidationErrors,
  authController.sendPhoneVerification
);

router.post(
  '/verify-phone',
  [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
    body('code').notEmpty().withMessage('Verification code is required'),
  ],
  handleValidationErrors,
  authController.verifyPhone
);

// Profile management routes
router.get('/profile', authenticate, authController.getProfile);
const mlaUpload = upload.fields([{ name: 'avatar', maxCount: 1 }]);
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
    body('currentLatitude')
      .optional()
      .isFloat()
      .withMessage('Latitude must be a number'),
    body('currentLongitude')
      .optional()
      .isFloat()
      .withMessage('Longitude must be a number'),
    body('currentAddress').optional().isString(),
    body('gender').optional().isString(),
    body('dateOfBirth').optional().isDate(),
  ],
  handleValidationErrors,
  mlaUpload,
  authController.updateProfile
);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  handleValidationErrors,
  authController.changePassword
);

router.post(
  '/update-location',
  authenticate,
  [
    body('latitude')
      .optional()
      .isFloat()
      .withMessage('Latitude must be a number'),
    body('longitude')
      .optional()
      .isFloat()
      .withMessage('Longitude must be a number'),
    body('address').optional().isString(),
  ],
  handleValidationErrors,
  authController.updateLocation
);

// MLA/Admin routes for member management
router.post(
  '/members',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('bodyType').notEmpty().withMessage('Body type is required'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
    body('bodyId').optional().isString(),
    body('designation').optional().isString(),
    body('description').optional().isString(),
    body('stateId').optional().isString(),
    body('districtId').optional().isString(),
    body('constituencyId').optional().isString(),
    body('canReceiveIssues').optional().isBoolean(),
    body('canUpdateIssues').optional().isBoolean(),
    body('canCreateSessions').optional().isBoolean(),
  ],
  handleValidationErrors,
  authController.addMember
);

router.put(
  '/members/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  [
    body('bodyType').optional().isString(),
    body('bodyId').optional().isString(),
    body('designation').optional().isString(),
    body('description').optional().isString(),
    body('canReceiveIssues').optional().isBoolean(),
    body('canUpdateIssues').optional().isBoolean(),
    body('canCreateSessions').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ],
  handleValidationErrors,
  authController.updateMember
);

router.delete(
  '/members/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.deleteMember
);

router.get(
  '/members',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 100'),
    query('bodyType').optional().isString(),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  authController.getMembers
);

// Utility routes
router.get(
  '/bodies',
  authenticate,
  [
    query('stateId').optional().isString(),
    query('districtId').optional().isString(),
    query('constituencyId').optional().isString(),
    query('type').optional().isString(),
  ],
  handleValidationErrors,
  authController.getBodies
);

// Body management routes
router.post(
  '/bodies',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('code').notEmpty().withMessage('Code is required'),
    body('type').notEmpty().withMessage('Type is required'),
    body('description').optional().isString(),
    body('address').optional().isString(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('headName').optional().isString(),
    body('contactEmail').optional().isEmail(),
    body('contactPhone').optional().isMobilePhone('any'),
    body('stateId').optional().isString(),
    body('districtId').optional().isString(),
    body('constituencyId').optional().isString(),
    body('parentBodyId').optional().isString(),
  ],
  handleValidationErrors,
  authController.createBody
);

router.put(
  '/bodies/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().isString(),
    body('address').optional().isString(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('headName').optional().isString(),
    body('contactEmail').optional().isEmail(),
    body('contactPhone').optional().isMobilePhone('any'),
    body('isActive').optional().isBoolean(),
  ],
  handleValidationErrors,
  authController.updateBody
);

router.delete(
  '/bodies/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.deleteBody
);

// Admin routes
router.get(
  '/admin/users',
  authenticate,
  authorize(['ADMIN']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role')
      .optional()
      .isIn(['ADMIN', 'CITIZEN', 'MLA', 'MEMBER'])
      .withMessage('Invalid role'),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  authController.getAllUsers
);

export default router;
