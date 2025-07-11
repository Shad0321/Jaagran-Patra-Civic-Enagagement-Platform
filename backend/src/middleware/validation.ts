import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Async error wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Profile validation schemas
export const validateUpdateProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('stateId')
    .optional()
    .isString()
    .withMessage('State ID must be a string'),
  body('districtId')
    .optional()
    .isString()
    .withMessage('District ID must be a string'),
  body('constituencyId')
    .optional()
    .isString()
    .withMessage('Constituency ID must be a string'),
  handleValidationErrors,
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  handleValidationErrors,
];

export const validateUpdateLocation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),
  handleValidationErrors,
];

// Subordinate management validation schemas
export const validateAddSubordinate = [
  body('subordinateId')
    .notEmpty()
    .isString()
    .withMessage('Subordinate ID is required'),
  body('type')
    .optional()
    .isIn(['DIRECT', 'INDIRECT', 'TEMPORARY'])
    .withMessage('Invalid subordinate type'),
  body('designation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
  body('stateId')
    .optional()
    .isString()
    .withMessage('State ID must be a string'),
  body('districtId')
    .optional()
    .isString()
    .withMessage('District ID must be a string'),
  body('constituencyId')
    .optional()
    .isString()
    .withMessage('Constituency ID must be a string'),
  body('shaktiKendraId')
    .optional()
    .isString()
    .withMessage('Shakti Kendra ID must be a string'),
  body('localBodyId')
    .optional()
    .isString()
    .withMessage('Local Body ID must be a string'),
  body('pollingBoothId')
    .optional()
    .isString()
    .withMessage('Polling Booth ID must be a string'),
  handleValidationErrors,
];

export const validateUpdateSubordinate = [
  param('id')
    .notEmpty()
    .isString()
    .withMessage('Subordinate relation ID is required'),
  body('type')
    .optional()
    .isIn(['DIRECT', 'INDIRECT', 'TEMPORARY'])
    .withMessage('Invalid subordinate type'),
  body('designation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Designation must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('stateId')
    .optional()
    .isString()
    .withMessage('State ID must be a string'),
  body('districtId')
    .optional()
    .isString()
    .withMessage('District ID must be a string'),
  body('constituencyId')
    .optional()
    .isString()
    .withMessage('Constituency ID must be a string'),
  body('shaktiKendraId')
    .optional()
    .isString()
    .withMessage('Shakti Kendra ID must be a string'),
  body('localBodyId')
    .optional()
    .isString()
    .withMessage('Local Body ID must be a string'),
  body('pollingBoothId')
    .optional()
    .isString()
    .withMessage('Polling Booth ID must be a string'),
  handleValidationErrors,
];

export const validateSubordinateId = [
  param('id')
    .notEmpty()
    .isString()
    .withMessage('Subordinate relation ID is required'),
  handleValidationErrors,
];

// Admin routes validation
export const validateGetUsers = [
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
    .isIn([
      'ADMIN',
      'CITIZEN',
      'MLA',
      'MEMBER',
      'ASSISTANT_PRO',
      'PRO',
      'MALIK',
      'SHAKTI_KENDRA_HEAD',
      'PANNA_PRAMUKH',
    ])
    .withMessage('Invalid role'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  handleValidationErrors,
];

export const validateUserId = [
  param('id').notEmpty().isString().withMessage('User ID is required'),
  handleValidationErrors,
];

export const validateUpdateUser = [
  param('id').notEmpty().isString().withMessage('User ID is required'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn([
      'ADMIN',
      'CITIZEN',
      'MLA',
      'MEMBER',
      'ASSISTANT_PRO',
      'PRO',
      'MALIK',
      'SHAKTI_KENDRA_HEAD',
      'PANNA_PRAMUKH',
    ])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('stateId')
    .optional()
    .isString()
    .withMessage('State ID must be a string'),
  body('districtId')
    .optional()
    .isString()
    .withMessage('District ID must be a string'),
  body('constituencyId')
    .optional()
    .isString()
    .withMessage('Constituency ID must be a string'),
  handleValidationErrors,
];

// Location routes validation
export const validateLocationId = [
  param('stateId')
    .optional()
    .notEmpty()
    .isString()
    .withMessage('State ID must be a valid string'),
  param('districtId')
    .optional()
    .notEmpty()
    .isString()
    .withMessage('District ID must be a valid string'),
  param('constituencyId')
    .optional()
    .notEmpty()
    .isString()
    .withMessage('Constituency ID must be a valid string'),
  param('shaktiKendraId')
    .optional()
    .notEmpty()
    .isString()
    .withMessage('Shakti Kendra ID must be a valid string'),
  param('localBodyId')
    .optional()
    .notEmpty()
    .isString()
    .withMessage('Local Body ID must be a valid string'),
  handleValidationErrors,
];

// General pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];
