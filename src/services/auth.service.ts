import { authRepository } from '@/repositories/auth.repository';
import { LoginCredentials, RegisterCredentials, JwtPayload } from '@/models/auth.model';
import { SafeUser } from '@/models/user.model';
import { generateToken } from '@/utils/helpers';
import { sanitizeUser } from '@/utils/formatters';
import { AppError } from '@/middlewares/error.middleware';
import { HTTP_STATUS } from '@/config/constants';

export class AuthService {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<{ user: SafeUser; token: string }> {
    // Check if email is available
    const isEmailAvailable = await authRepository.isEmailAvailable(credentials.email);
    if (!isEmailAvailable) {
      throw new AppError('Email is already registered', HTTP_STATUS.CONFLICT);
    }

    // Create user
    const user = await authRepository.register(credentials);
    const safeUser = sanitizeUser(user);

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    return { user: safeUser, token };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: SafeUser; token: string }> {
    // Authenticate user
    const user = await authRepository.authenticate(credentials);
    if (!user) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Account is suspended', HTTP_STATUS.FORBIDDEN);
    }

    if (user.status === 'DELETED') {
      throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);
    }

    const safeUser = sanitizeUser(user);

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    return { user: safeUser, token };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: { name?: string; bio?: string }): Promise<SafeUser> {
    const user = await authRepository.updateProfile(userId, profileData);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const success = await authRepository.changePassword(userId, currentPassword, newPassword);
    if (!success) {
      throw new AppError('Invalid current password', HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Validate user exists and is active
   */
  async validateUser(userId: string): Promise<SafeUser> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('User account is not active', HTTP_STATUS.FORBIDDEN);
    }

    return sanitizeUser(user);
  }
}

export const authService = new AuthService();
