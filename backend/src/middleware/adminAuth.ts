import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const requireAdminRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
};

export const requireAdminOrMLARole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'MLA') {
    res
      .status(403)
      .json({ success: false, error: 'Admin or MLA access required' });
    return;
  }

  next();
};
