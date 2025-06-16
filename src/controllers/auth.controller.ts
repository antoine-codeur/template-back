import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import {
  registerHandler,
  loginHandler,
  getProfileHandler,
  updateProfileHandler,
  changePasswordHandler,
} from '@/handlers/auth/auth.handler';
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from '@/models/auth.model';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse } from '@/types';

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    await registerHandler(validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    await loginHandler(validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

export const getMeController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      message: 'Authentication required',
      error: 'Authentication required',
    };
    res.status(HTTP_STATUS.UNAUTHORIZED).json(response);
    return;
  }

  await getProfileHandler(req.user.id, res);
};

export const updateProfileController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    await updateProfileHandler(req.user.id, validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};

export const changePasswordController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    const validatedData = ChangePasswordSchema.parse(req.body);
    await changePasswordHandler(req.user.id, validatedData, res);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid input data',
      error: 'Invalid input data',
    };
    res.status(HTTP_STATUS.BAD_REQUEST).json(response);
  }
};
