import { prisma } from '@/config/database';
import { User, CreateUser, UpdateUser, UserQuery } from '@/models/user.model';
import { UserStatus, UserRole } from '@/types';
import { Prisma } from '@prisma/client';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: CreateUser): Promise<User> {
    const user = await prisma.user.create({
      data: {
        ...userData,
        name: userData.name ?? null,
        bio: userData.bio ?? null,
      },
    });
    return user as User;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as User | null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as User | null;
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateUser): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          name: data.name !== undefined ? data.name ?? null : undefined,
          bio: data.bio !== undefined ? data.bio ?? null : undefined,
          updatedAt: new Date(),
        },
      });
      return user as User;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete user by ID (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          status: 'DELETED',
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Hard delete user by ID
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Find all users with pagination and filters
   */
  async findMany(query: UserQuery): Promise<{ users: User[]; total: number }> {
    const { page, limit, sortBy, sortOrder, search, role, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users as User[], total };
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // User not found - this is acceptable for login flow, just ignore
        return;
      }
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: string, hashedPassword: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspend(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Activate user
   */
  async activate(id: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Update email verification status
   */
  async updateEmailVerification(id: string, verified: boolean): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          emailVerified: verified,
          emailVerifiedAt: verified ? new Date() : null,
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Get user count by role
   */
  async getUserCountByRole(): Promise<Record<UserRole, number>> {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const result: Record<UserRole, number> = {
      USER: 0,
      ADMIN: 0,
      SUPER_ADMIN: 0,
    };

    counts.forEach((count) => {
      result[count.role as UserRole] = count._count.role;
    });

    return result;
  }
}

export const userRepository = new UserRepository();
