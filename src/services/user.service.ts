import { userRepository } from '@/repositories/user.repository';
import { User, SafeUser, UserQuery, UpdateUser } from '@/models/user.model';
import { PaginatedResponse } from '@/types';
import { sanitizeUser, calculatePagination } from '@/utils/formatters';
import { AppError } from '@/middlewares/error.middleware';
import { HTTP_STATUS } from '@/config/constants';
import { FileService, ProcessedImage } from '@/services/file.service';

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(query: UserQuery): Promise<PaginatedResponse<SafeUser>> {
    const { users, total } = await userRepository.findMany(query);
    
    const safeUsers = users.map(user => sanitizeUser(user));
    const pagination = calculatePagination(query.page, query.limit, total);

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: safeUsers,
        pagination,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateData: UpdateUser): Promise<SafeUser> {
    const user = await userRepository.update(id, updateData);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    const success = await userRepository.delete(id);
    if (!success) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(id: string): Promise<SafeUser> {
    const success = await userRepository.suspendUser(id, {
      reason: 'Suspended by admin',
      suspendedBy: 'system',
    });
    if (!success) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const user = await userRepository.findById(id);
    return sanitizeUser(user!);
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<SafeUser> {
    const success = await userRepository.activateUser(id, 'system');
    if (!success) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const user = await userRepository.findById(id);
    return sanitizeUser(user!);
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const roleCounts = await userRepository.getUserCountByRole();
    
    return {
      totalUsers: Object.values(roleCounts).reduce((sum, count) => sum + count, 0),
      usersByRole: roleCounts,
    };
  }

  /**
   * Check if user exists
   */
  async userExists(id: string): Promise<boolean> {
    const user = await userRepository.findById(id);
    return !!user;
  }

  /**
   * Get current user profile (for authenticated users)
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Update current user profile (for authenticated users)
   */
  async updateCurrentUser(userId: string, updateData: { name?: string; bio?: string }): Promise<SafeUser> {
    const user = await userRepository.update(userId, updateData);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Get real user from database by ID (for auth middleware compatibility)
   */
  async getRealUser(userId: string): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    return sanitizeUser(user);
  }

  /**
   * Update user profile image
   */
  async updateProfileImage(userId: string, file: Express.Multer.File): Promise<SafeUser> {
    // Get current user to check for existing profile image
    const currentUser = await userRepository.findById(userId);
    if (!currentUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Delete old profile image if exists
    if (currentUser.profileImageUrl) {
      const oldFilename = FileService.extractFilenameFromUrl(currentUser.profileImageUrl);
      if (oldFilename) {
        await FileService.deleteProfileImage(oldFilename);
      }
    }

    // Process and save new image
    const processedImage: ProcessedImage = await FileService.processProfileImage(file);

    // Update user with new profile image URL
    const updatedUser = await userRepository.update(userId, {
      profileImageUrl: processedImage.url
    });

    if (!updatedUser) {
      // Clean up uploaded file if user update fails
      await FileService.deleteProfileImage(processedImage.filename);
      throw new AppError('Failed to update user profile image', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return sanitizeUser(updatedUser);
  }

  /**
   * Delete user profile image
   */
  async deleteProfileImage(userId: string): Promise<SafeUser> {
    const currentUser = await userRepository.findById(userId);
    if (!currentUser) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!currentUser.profileImageUrl) {
      throw new AppError('User has no profile image', HTTP_STATUS.BAD_REQUEST);
    }

    // Delete file from filesystem
    const filename = FileService.extractFilenameFromUrl(currentUser.profileImageUrl);
    if (filename) {
      await FileService.deleteProfileImage(filename);
    }

    // Remove URL from database
    const updatedUser = await userRepository.update(userId, {
      profileImageUrl: null
    });

    if (!updatedUser) {
      throw new AppError('Failed to delete profile image', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return sanitizeUser(updatedUser);
  }
}

export const userService = new UserService();
