import { userRepository } from './user.repository';
import { User } from '@/models/user.model';
import { LoginCredentials, RegisterCredentials } from '@/models/auth.model';
import { hashPassword, comparePassword } from '@/utils/helpers';
import { normalizeEmail } from '@/utils/formatters';

export class AuthRepository {
  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const normalizedEmail = normalizeEmail(credentials.email);
    const hashedPassword = await hashPassword(credentials.password);

    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      name: credentials.name,
      role: 'USER' as const,
    };

    return userRepository.create(userData);
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(credentials: LoginCredentials): Promise<User | null> {
    const normalizedEmail = normalizeEmail(credentials.email);
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const isPasswordValid = await comparePassword(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login and return updated user
    await userRepository.updateLastLogin(user.id);
    
    // Return the updated user with current lastLogin
    return userRepository.findById(user.id);
  }

  /**
   * Find user by email for authentication
   */
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);
    return userRepository.findByEmail(normalizedEmail);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  /**
   * Check if email is available for registration
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);
    return !(await userRepository.emailExists(normalizedEmail));
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);
    return userRepository.changePassword(userId, hashedNewPassword);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: { name?: string; bio?: string }): Promise<User | null> {
    return userRepository.update(userId, profileData);
  }
}

export const authRepository = new AuthRepository();
