import express from 'express';
import * as authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Password reset routes
router.post(
  '/forgot-password',
  authLimiter,
  authController.initiatePasswordReset
);
router.post(
  '/reset-password',
  authLimiter,
  authController.completePasswordReset
);

// Email verification routes
router.post(
  '/resend-verification-email',
  authLimiter,
  authController.resendVerificationEmail
);
router.post('/verify-email', authController.verifyEmail);

// Phone verification routes
router.post(
  '/send-phone-verification',
  authLimiter,
  authController.sendPhoneVerification
);
router.post('/verify-phone', authController.verifyPhone);

// Profile management routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/update-location', authenticate, authController.updateLocation);

// Subordinate management routes
router.get(
  '/subordinates',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.getSubordinates
);
router.post(
  '/subordinates',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.addSubordinate
);
router.put(
  '/subordinates/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.updateSubordinate
);
router.delete(
  '/subordinates/:id',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.removeSubordinate
);
router.get(
  '/subordinates/hierarchy',
  authenticate,
  authorize(['MLA', 'ADMIN']),
  authController.getSubordinateHierarchy
);

// Admin routes
router.get(
  '/users',
  authenticate,
  authorize(['ADMIN']),
  authController.getAllUsers
);
router.get(
  '/users/:id',
  authenticate,
  authorize(['ADMIN']),
  authController.getUserById
);
router.put(
  '/users/:id',
  authenticate,
  authorize(['ADMIN']),
  authController.updateUser
);
router.delete(
  '/users/:id',
  authenticate,
  authorize(['ADMIN']),
  authController.deleteUser
);
router.post(
  '/users/:id/activate',
  authenticate,
  authorize(['ADMIN']),
  authController.activateUser
);
router.post(
  '/users/:id/deactivate',
  authenticate,
  authorize(['ADMIN']),
  authController.deactivateUser
);

// Location and hierarchy routes
router.get('/locations/states', generalLimiter, authController.getStates);
router.get(
  '/locations/districts/:stateId',
  generalLimiter,
  authController.getDistrictsByState
);
router.get(
  '/locations/constituencies/:districtId',
  generalLimiter,
  authController.getConstituenciesByDistrict
);
router.get(
  '/locations/shakti-kendras/:constituencyId',
  generalLimiter,
  authController.getShaktiKendrasByConstituency
);
router.get(
  '/locations/local-bodies/:shaktiKendraId',
  generalLimiter,
  authController.getLocalBodiesByShaktiKendra
);
router.get(
  '/locations/polling-booths/:localBodyId',
  generalLimiter,
  authController.getPollingBoothsByLocalBody
);

export default router;
