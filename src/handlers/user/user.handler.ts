import { Response } from 'express';
import { userService } from '@/services/user.service';
import { UserQuery, UpdateUser } from '@/models/user.model';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse } from '@/types';
import { logger } from '@/config/logger';

export const getUsersHandler = async (
  query: UserQuery,
  res: Response
): Promise<void> => {
  try {
    const result = await userService.getUsers(query);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    logger.error('Get users failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get users',
      error: error instanceof Error ? error.message : 'Failed to get users',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const getUserByIdHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.getUserById(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: { user },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Get user by ID failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user',
      error: error instanceof Error ? error.message : 'Failed to get user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const updateUserHandler = async (
  userId: string,
  updateData: UpdateUser,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.updateUser(userId, updateData);
    
    logger.info('User updated successfully', { userId });

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User updated successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Update user failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
      error: error instanceof Error ? error.message : 'Failed to update user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const deleteUserHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    await userService.deleteUser(userId);
    
    logger.info('User deleted successfully', { userId });

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
      data: {},
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Delete user failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const suspendUserHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.suspendUser(userId);
    
    logger.info('User suspended successfully', { userId });

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'User suspended successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Suspend user failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to suspend user',
      error: error instanceof Error ? error.message : 'Failed to suspend user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const activateUserHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.activateUser(userId);
    
    logger.info('User activated successfully', { userId });

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'User activated successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Activate user failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to activate user',
      error: error instanceof Error ? error.message : 'Failed to activate user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const getCurrentUserHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    const user = await userService.getCurrentUser(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Get current user failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const response: ApiResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user',
      error: error instanceof Error ? error.message : 'Failed to get user',
    };

    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

    res.status(statusCode).json(response);
  }
};

export const updateCurrentUserHandler = async (
  userId: string,
  updateData: { name?: string; bio?: string },
  res: Response
): Promise<void> => {
  try {
    const user = await userService.updateCurrentUser(userId, updateData);
    
    logger.info('Current user updated successfully', { userId });

    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'User profile updated successfully',
    };

    res.status(HTTP_STATUS.OK).json(response);
  } catch (error) {
    logger.error('Update current user failed', {
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
