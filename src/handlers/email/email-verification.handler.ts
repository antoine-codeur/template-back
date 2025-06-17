import { Response } from 'express';
import { EmailService } from '@/services/email.service';
import { EmailRepository } from '@/repositories/email.repository';
import { userRepository } from '@/repositories/user.repository';
import { HTTP_STATUS, EMAIL_CONSTANTS } from '@/config/constants';
import { ApiResponse } from '@/types';
import { logger } from '@/config/logger';
import { AppError } from '@/middlewares/error.middleware';

/**
 * Send email verification
 */
export const sendEmailVerificationHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if already verified
    if (user.emailVerified) {
      const response: ApiResponse = {
        success: true,
        message: 'Email is already verified',
      };
      res.status(HTTP_STATUS.OK).json(response);
      return;
    }

    // Check rate limiting 
    const canRequest = await EmailRepository.canRequestVerification(userId);
    if (!canRequest) {
      throw new AppError(
        'Too many verification emails sent. Please wait before requesting another.',
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    }

    // Generate verification token
    const token = await EmailRepository.createVerificationToken(userId);

    // Send verification email
    await EmailService.sendVerificationEmail({
      to: user.email,
      name: user.name || 'User',
      verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    });

    logger.info('Email verification sent', {
      userId: user.id,
      email: user.email,
      token: token,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Verification email sent successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Failed to send email verification', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification email',
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    };

    const statusCode = error instanceof AppError 
      ? error.statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const verifyEmailHandler = async (
  token: string,
  res: Response
): Promise<void> => {
  try {
    // Find and validate token - this also consumes it
    const result = await EmailRepository.verifyAndConsumeToken(token, 'VERIFICATION');
    if (!result.isValid) {
      throw new AppError('Invalid or expired verification token', HTTP_STATUS.BAD_REQUEST);
    }

    const { userId } = result;

    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if already verified
    if (user.emailVerified) {
      const response: ApiResponse = {
        success: true,
        message: 'Email is already verified',
      };
      res.status(HTTP_STATUS.OK).json(response);
      return;
    }

    // Update user email verification status
    await userRepository.updateEmailVerification(user.id, true);

    logger.info('Email verified successfully', {
      userId: user.id,
      email: user.email,
      token: token,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Email verification failed', {
      token,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Email verification failed',
      error: error instanceof Error ? error.message : 'Email verification failed',
    };

    const statusCode = error instanceof AppError 
      ? error.statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};
