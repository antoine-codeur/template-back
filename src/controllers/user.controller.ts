import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import {
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  suspendUserHandler,
  activateUserHandler,
  getCurrentUserHandler,
  updateCurrentUserHandler,
} from '@/handlers/user/user.handler';
import {
  uploadProfileImageHandler,
  deleteProfileImageHandler
} from '@/handlers/user/profile-image.handler';
import { UserQuerySchema, UpdateUserSchema, UpdateProfileSchema } from '@/models/user.model';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse } from '@/types';
import { isValidUUID } from '@/utils/validators';

export const getUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedQuery = UserQuerySchema.parse({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search as string,
      role: req.query.role as string,
      status: req.query.status as string,
    });
    
    await getUsersHandler(validatedQuery, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid query parameters',
      error: 'Invalid query parameters',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid user ID format',
      error: 'Invalid user ID format',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  await getUserByIdHandler(id, res);
};

export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid user ID format',
      error: 'Invalid user ID format',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  try {
    const validatedData = UpdateUserSchema.parse(req.body);
    await updateUserHandler(id, validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

export const deleteUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid user ID format',
      error: 'Invalid user ID format',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  // Check if admin is trying to delete themselves
  if (req.user && req.user.id === id) {
    const response: ApiResponse = {
      success: false,
      message: 'You cannot delete your own account',
      error: 'You cannot delete your own account',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  await deleteUserHandler(id, res);
};

export const suspendUserController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid user ID format',
      error: 'Invalid user ID format',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  await suspendUserHandler(id, res);
};

export const activateUserController = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id || !isValidUUID(id)) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid user ID format',
      error: 'Invalid user ID format',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  await activateUserHandler(id, res);
};

// Regular user controllers (for /users/me endpoints)
export const getCurrentUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: 'Authentication required',
      error: 'Authentication required',
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    return;
  }

  await getCurrentUserHandler(req.user.id, res);
};

export const updateCurrentUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: 'Authentication required',
      error: 'Authentication required',
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    return;
  }

  try {
    const validatedData = UpdateProfileSchema.parse(req.body);
    await updateCurrentUserHandler(req.user.id, validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

/**
 * Upload profile image controller
 */
export const uploadProfileImageController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
      error: 'User not authenticated'
    });
    return;
  }

  await uploadProfileImageHandler(req.user.id, req.file!, res);
};

/**
 * Delete profile image controller
 */
export const deleteProfileImageController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required',
      error: 'User not authenticated'
    });
    return;
  }

  await deleteProfileImageHandler(req.user.id, res);
};

// Export aliases for route compatibility
export const getMeController = getCurrentUserController;
export const updateMeController = updateCurrentUserController;
