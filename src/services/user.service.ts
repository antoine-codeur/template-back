import { userRepository } from '@/repositories/user.repository';
import { User, SafeUser, UserQuery, UpdateUser } from '@/models/user.model';
import { PaginatedResponse } from '@/types';
import { sanitizeUser, calculatePagination } from '@/utils/formatters';
import { AppError } from '@/middlewares/error.middleware';
import { HTTP_STATUS } from '@/config/constants';

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
    const success = await userRepository.suspend(id);
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
    const success = await userRepository.activate(id);
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
}

export const userService = new UserService();
