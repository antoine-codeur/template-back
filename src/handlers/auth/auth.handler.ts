import { Response } from 'express';
import { authService } from '@/services/auth.service';
import { LoginCredentials, RegisterCredentials } from '@/models/auth.model';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse } from '@/types';
import { logger } from '@/config/logger';

export const registerHandler = async (
  credentials: RegisterCredentials,
  res: Response
): Promise<void> => {
  try {
    const result = await authService.register(credentials);
    
    logger.info('User registered successfully', { 
      userId: result.user.id, 
      email: result.user.email 
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: 'User registered successfully',
    };

    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    logger.error('Registration failed', { 
      email: credentials.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
      error: error instanceof Error ? error.message : 'Registration failed',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const loginHandler = async (
  credentials: LoginCredentials,
  res: Response
): Promise<void> => {
  try {
    const result = await authService.login(credentials);
    
    logger.info('User logged in successfully', { 
      userId: result.user.id, 
      email: result.user.email 
    });

    const response: ApiResponse = {
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
      message: 'Login successful',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.warn('Login failed', { 
      email: credentials.email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
      error: error instanceof Error ? error.message : 'Login failed',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const getProfileHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    const user = await authService.getProfile(userId);

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Get profile failed', { 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get profile',
      error: error instanceof Error ? error.message : 'Failed to get profile',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const updateProfileHandler = async (
  userId: string,
  profileData: { name?: string; bio?: string },
  res: Response
): Promise<void> => {
  try {
    const user = await authService.updateProfile(userId, profileData);
    
    logger.info('Profile updated successfully', { userId });

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'Profile updated successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Update profile failed', { 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const changePasswordHandler = async (
  userId: string,
  passwordData: { currentPassword: string; newPassword: string },
  res: Response
): Promise<void> => {
  try {
    await authService.changePassword(userId, passwordData.currentPassword, passwordData.newPassword);
    
    logger.info('Password changed successfully', { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
      data: {},
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Change password failed', { 
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password',
      error: error instanceof Error ? error.message : 'Failed to change password',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};
