import { Request, Response } from 'express';
import { 
  sendEmailVerificationHandler,
  verifyEmailHandler 
} from '@/handlers/email/email-verification.handler';
import { 
  sendPasswordResetHandler,
  resetPasswordHandler,
  validateResetTokenHandler 
} from '@/handlers/email/password-reset.handler';
import {
  PasswordResetRequestSchema,
  PasswordResetConfirmSchema,
  EmailVerificationSchema 
} from '@/models/email.model';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse } from '@/types';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Send email verification
 * POST /api/email/send-verification
 */
export const sendEmailVerificationController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: 'User not authenticated',
        error: 'Authentication required',
      };
      res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
      return;
    }

    await sendEmailVerificationHandler(userId, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to send verification email',
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};

/**
 * Verify email with token
 * POST /api/email/verify
 */
export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = EmailVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid request data',
        error: 'Invalid token format',
      };
      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    await verifyEmailHandler(validation.data.token, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Email verification failed',
      error: error instanceof Error ? error.message : 'Email verification failed',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};

/**
 * Send password reset email
 * POST /api/email/password-reset/send
 */
export const sendPasswordResetController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = PasswordResetRequestSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid request data',
        error: 'Invalid email format',
      };
      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    await sendPasswordResetHandler({ email: validation.data.email }, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Failed to send password reset email',
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};

/**
 * Validate password reset token
 * POST /api/email/password-reset/validate
 */
export const validateResetTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = EmailVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid request data',
        error: 'Invalid token format',
      };
      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    await validateResetTokenHandler(validation.data.token, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Token validation failed',
      error: error instanceof Error ? error.message : 'Token validation failed',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};

/**
 * Reset password with token
 * POST /api/email/password-reset/confirm
 */
export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = PasswordResetConfirmSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid request data',
        error: 'Invalid token or password format',
      };
      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    await resetPasswordHandler(validation.data.token, validation.data.password, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Password reset failed',
      error: error instanceof Error ? error.message : 'Password reset failed',
    };
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
  }
};
