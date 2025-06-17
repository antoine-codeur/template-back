import { AppError } from '@/middlewares/error.middleware';
import { logger } from '@/config/logger';
import { userRepository } from '@/repositories/user.repository';
import { EmailService } from '@/services/email.service';
import { SuspendUser, ActivateUser } from '@/models/user.model';

/**
 * Suspend a user account
 */
export const suspendUserHandler = async (
  userId: string,
  suspensionData: SuspendUser,
  adminId: string
): Promise<void> => {
  try {
    logger.info('Attempting to suspend user', { userId, adminId });

    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is already suspended
    if (user.status === 'SUSPENDED') {
      throw new AppError('User is already suspended', 400);
    }

    // Cannot suspend deleted users
    if (user.status === 'DELETED') {
      throw new AppError('Cannot suspend deleted user', 400);
    }

    // Cannot suspend admin or super admin users (additional safety)
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot suspend admin users', 403);
    }

    // Suspend the user
    await userRepository.suspendUser(userId, {
      reason: suspensionData.reason,
      suspendedBy: adminId,
    });

    // Send suspension notification email
    try {
      await EmailService.sendAccountSuspendedEmail({
        to: user.email,
        name: user.name || 'User',
        reason: suspensionData.reason,
        suspendedBy: adminId,
      });
    } catch (emailError) {
      logger.warn('Failed to send suspension notification email', { 
        error: emailError, 
        userId,
        adminId 
      });
      // Don't fail the suspension if email fails
    }

    logger.info('User suspended successfully', { 
      userId, 
      adminId, 
      reason: suspensionData.reason 
    });
  } catch (error) {
    logger.error('Failed to suspend user', { error, userId, adminId });
    throw error;
  }
};

/**
 * Activate a suspended user account
 */
export const activateUserHandler = async (
  userId: string,
  activationData: ActivateUser,
  adminId: string
): Promise<void> => {
  try {
    logger.info('Attempting to activate user', { userId, adminId });

    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is suspended
    if (user.status !== 'SUSPENDED') {
      throw new AppError('User is not suspended', 400);
    }

    // Activate the user
    await userRepository.activateUser(userId, adminId);

    // Send activation notification email
    try {
      await EmailService.sendAccountActivatedEmail({
        to: user.email,
        name: user.name || 'User',
        reason: activationData.reason,
        activatedBy: adminId,
      });
    } catch (emailError) {
      logger.warn('Failed to send activation notification email', { 
        error: emailError, 
        userId,
        adminId 
      });
      // Don't fail the activation if email fails
    }

    logger.info('User activated successfully', { 
      userId, 
      adminId, 
      reason: activationData.reason 
    });
  } catch (error) {
    logger.error('Failed to activate user', { error, userId, adminId });
    throw error;
  }
};

/**
 * Get suspension details for a user
 */
export const getUserSuspensionDetailsHandler = async (
  userId: string
): Promise<{
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
}> => {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      isSuspended: user.status === 'SUSPENDED',
      suspensionReason: user.suspensionReason || undefined,
      suspendedAt: user.suspendedAt || undefined,
      suspendedBy: user.suspendedBy || undefined,
    };
  } catch (error) {
    logger.error('Failed to get suspension details', { error, userId });
    throw error;
  }
};
