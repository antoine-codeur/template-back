import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, USER_ROLES } from '@/config/constants';
import { AuthenticatedRequest, UserRole, ApiResponse } from '@/types';
import { extractBearerToken, verifyToken } from '@/utils/helpers';
import { AppError } from './error.middleware';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError('Authentication token is required', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = verifyToken(token);
    
    // You would typically fetch the user from database here
    // For now, we'll just attach the payload info
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      // These would come from database
      name: null,
      bio: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired token',
      error: 'Invalid or expired token',
    };

    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
        error: 'Authentication required',
      };

      res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        message: 'Insufficient permissions',
        error: 'Insufficient permissions',
      };

      res.status(HTTP_STATUS.FORBIDDEN).json(response);
      return;
    }

    next();
  };
};

// Convenience middleware for admin access
export const requireAdmin = authorize([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);

// Convenience middleware for super admin access
export const requireSuperAdmin = authorize([USER_ROLES.SUPER_ADMIN]);
