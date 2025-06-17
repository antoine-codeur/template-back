import { Response } from 'express';
import { EmailService } from '@/services/email.service';
import { EmailRepository } from '@/repositories/email.repository';
import { userRepository } from '@/repositories/user.repository';
import { authRepository } from '@/repositories/auth.repository';
import { HTTP_STATUS, EMAIL_CONSTANTS } from '@/config/constants';
import { ApiResponse } from '@/types';
import { logger } from '@/config/logger';
import { AppError } from '@/middlewares/error.middleware';

export interface ResetPasswordRequest {
  email: string;
}

/**
 * Send password reset email
 */
export const sendPasswordResetHandler = async (
  resetRequest: ResetPasswordRequest,
  res: Response
): Promise<void> => {
  try {
    // Find user by email
    const user = await userRepository.findByEmail(resetRequest.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      const response: ApiResponse = {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
      res.status(HTTP_STATUS.OK).json(response);
      return;
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      const response: ApiResponse = {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
      res.status(HTTP_STATUS.OK).json(response);
      return;
    }

    // Check rate limiting - use the same method for password reset  
    const canRequest = await EmailRepository.canRequestVerification(user.id);
    if (!canRequest) {
      throw new AppError(
        'Too many password reset emails sent. Please wait before requesting another.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    // Generate reset token
    const token = await EmailRepository.createPasswordResetToken(user.id);

    // Send password reset email
    await EmailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name || 'User',
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
    });

    logger.info('Password reset email sent', {
      userId: user.id,
      email: user.email,
      token: token,
    });

    const response: ApiResponse = {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Failed to send password reset email', {
      email: resetRequest.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send password reset email',
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
    };

    const statusCode = error instanceof AppError 
      ? error.statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const resetPasswordHandler = async (
  token: string,
  newPassword: string,
  res: Response
): Promise<void> => {
  try {
    // Find and validate token - this also consumes it
    const result = await EmailRepository.verifyAndConsumeToken(token, 'PASSWORD_RESET');
    if (!result.isValid) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    const { userId } = result;

    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', HTTP_STATUS.FORBIDDEN);
    }

    // Update password
    await authRepository.updatePassword(user.id, newPassword);

    // Send password changed confirmation email
    try {
      await EmailService.sendPasswordChangedEmail({
        to: user.email,
        name: user.name || 'User',
      });
    } catch (emailError) {
      // Log error but don't fail the request
      logger.error('Failed to send password changed confirmation email', {
        userId: user.id,
        email: user.email,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    }

    logger.info('Password reset successfully', {
      userId: user.id,
      email: user.email,
      token: token,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Password reset failed', {
      token,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed',
      error: error instanceof Error ? error.message : 'Password reset failed',
    };

    const statusCode = error instanceof AppError 
      ? error.statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

/**
 * Validate password reset token
 */
export const validateResetTokenHandler = async (
  token: string,
  res: Response
): Promise<void> => {
  try {
    // Get token info without consuming it
    const emailToken = await EmailRepository.getTokenInfo(token);
    if (!emailToken || emailToken.type !== 'PASSWORD_RESET' || emailToken.usedAt || emailToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', HTTP_STATUS.BAD_REQUEST);
    }

    // Get user to ensure they still exist and are active
    const user = await userRepository.findById(emailToken.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid reset token', HTTP_STATUS.BAD_REQUEST);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Reset token is valid',
      data: {
        email: user.email, // Return email for UI display
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Reset token validation failed', {
      token,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Invalid or expired reset token',
      error: error instanceof Error ? error.message : 'Invalid or expired reset token',
    };

    const statusCode = error instanceof AppError 
      ? error.statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};
