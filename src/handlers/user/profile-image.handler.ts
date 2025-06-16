import { Response } from 'express';
import { userService } from '@/services/user.service';
import { AppError } from '@/middlewares/error.middleware';
import { HTTP_STATUS } from '@/config/constants';
import { FileService } from '@/services/file.service';

/**
 * Upload profile image handler
 */
export const uploadProfileImageHandler = async (
  userId: string,
  file: Express.Multer.File,
  res: Response
): Promise<void> => {
  try {
    if (!file) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file provided',
        error: 'Profile image file is required'
      });
      return;
    }

    // Ensure user exists first
    await userService.getRealUser(userId);

    const updatedUser = await userService.updateProfileImage(userId, file);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to upload profile image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

/**
 * Delete profile image handler
 */
export const deleteProfileImageHandler = async (
  userId: string,
  res: Response
): Promise<void> => {
  try {
    // Ensure user exists first
    await userService.getRealUser(userId);

    const updatedUser = await userService.deleteProfileImage(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile image deleted successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete profile image',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
