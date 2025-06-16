import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, USER_ROLES } from '@/config/constants';
import { AuthenticatedRequest, UserRole, ApiResponse, SafeUser } from '@/types';
import { extractBearerToken, verifyToken } from '@/utils/helpers';
import { AppError } from './error.middleware';
import { UserRepository } from '@/repositories/user.repository';

// Helper function to convert User to SafeUser
const toSafeUser = (user: any): SafeUser => ({
  id: user.id,
  email: user.email,
  name: user.name ?? null,
  bio: user.bio ?? null,
  profileImageUrl: user.profileImageUrl ?? null,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLogin: user.lastLogin ?? null,
});

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
    
    // Fetch the user from database
    const userRepository = new UserRepository();
    const user = await userRepository.findById(payload.userId);
    
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = toSafeUser(user);

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid or expired token',
      error: error instanceof AppError ? error.message : 'Invalid or expired token',
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
