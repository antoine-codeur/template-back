import { 
  suspendUserHandler, 
  activateUserHandler, 
  getUserSuspensionDetailsHandler 
} from '@/handlers/user/user-suspension.handler';
import { userRepository } from '@/repositories/user.repository';
import { EmailService } from '@/services/email.service';
import { AppError } from '@/middlewares/error.middleware';

// Mock dependencies
jest.mock('@/repositories/user.repository');
jest.mock('@/services/email.service');
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe('User Suspension Handlers Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suspendUserHandler', () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      status: 'ACTIVE',
      role: 'USER',
    };

    const suspensionData = {
      reason: 'Violation of terms of service',
    };

    const adminId = 'admin-123';

    it('should successfully suspend a user', async () => {
      // Given: Valid user and suspension data
      mockedUserRepository.findById.mockResolvedValue(mockUser as any);
      mockedUserRepository.suspendUser.mockResolvedValue(true);
      mockedEmailService.sendAccountSuspendedEmail.mockResolvedValue(true);

      // When: Handler is called
      await suspendUserHandler('user-123', suspensionData, adminId);

      // Then: User is suspended and email is sent
      expect(mockedUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockedUserRepository.suspendUser).toHaveBeenCalledWith('user-123', {
        reason: suspensionData.reason,
        suspendedBy: adminId,
      });
      expect(mockedEmailService.sendAccountSuspendedEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        name: mockUser.name,
        reason: suspensionData.reason,
        suspendedBy: adminId,
      });
    });

    it('should throw error if user not found', async () => {
      // Given: Non-existent user
      mockedUserRepository.findById.mockResolvedValue(null);

      // When & Then: Handler should throw error
      await expect(
        suspendUserHandler('non-existent', suspensionData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        suspendUserHandler('non-existent', suspensionData, adminId)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user is already suspended', async () => {
      // Given: Already suspended user
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      mockedUserRepository.findById.mockResolvedValue(suspendedUser as any);

      // When & Then: Handler should throw error
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow('User is already suspended');
    });

    it('should throw error if trying to suspend deleted user', async () => {
      // Given: Deleted user
      const deletedUser = { ...mockUser, status: 'DELETED' };
      mockedUserRepository.findById.mockResolvedValue(deletedUser as any);

      // When & Then: Handler should throw error
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow('Cannot suspend deleted user');
    });

    it('should throw error if trying to suspend admin user', async () => {
      // Given: Admin user
      const adminUser = { ...mockUser, role: 'ADMIN' };
      mockedUserRepository.findById.mockResolvedValue(adminUser as any);

      // When & Then: Handler should throw error
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow('Cannot suspend admin users');
    });

    it('should throw error if trying to suspend super admin user', async () => {
      // Given: Super admin user
      const superAdminUser = { ...mockUser, role: 'SUPER_ADMIN' };
      mockedUserRepository.findById.mockResolvedValue(superAdminUser as any);

      // When & Then: Handler should throw error
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).rejects.toThrow('Cannot suspend admin users');
    });

    it('should continue if email sending fails', async () => {
      // Given: Valid user but email service fails
      mockedUserRepository.findById.mockResolvedValue(mockUser as any);
      mockedUserRepository.suspendUser.mockResolvedValue(true);
      mockedEmailService.sendAccountSuspendedEmail.mockRejectedValue(new Error('Email service error'));

      // When: Handler is called
      await expect(
        suspendUserHandler('user-123', suspensionData, adminId)
      ).resolves.not.toThrow();

      // Then: User is still suspended despite email failure
      expect(mockedUserRepository.suspendUser).toHaveBeenCalled();
    });
  });

  describe('activateUserHandler', () => {
    const mockSuspendedUser = {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      status: 'SUSPENDED',
      role: 'USER',
    };

    const activationData = {
      reason: 'Issue resolved',
    };

    const adminId = 'admin-123';

    it('should successfully activate a suspended user', async () => {
      // Given: Valid suspended user and activation data
      mockedUserRepository.findById.mockResolvedValue(mockSuspendedUser as any);
      mockedUserRepository.activateUser.mockResolvedValue(true);
      mockedEmailService.sendAccountActivatedEmail.mockResolvedValue(true);

      // When: Handler is called
      await activateUserHandler('user-123', activationData, adminId);

      // Then: User is activated and email is sent
      expect(mockedUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockedUserRepository.activateUser).toHaveBeenCalledWith('user-123', adminId);
      expect(mockedEmailService.sendAccountActivatedEmail).toHaveBeenCalledWith({
        to: mockSuspendedUser.email,
        name: mockSuspendedUser.name,
        reason: activationData.reason,
        activatedBy: adminId,
      });
    });

    it('should throw error if user not found', async () => {
      // Given: Non-existent user
      mockedUserRepository.findById.mockResolvedValue(null);

      // When & Then: Handler should throw error
      await expect(
        activateUserHandler('non-existent', activationData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        activateUserHandler('non-existent', activationData, adminId)
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user is not suspended', async () => {
      // Given: Active user (not suspended)
      const activeUser = { ...mockSuspendedUser, status: 'ACTIVE' };
      mockedUserRepository.findById.mockResolvedValue(activeUser as any);

      // When & Then: Handler should throw error
      await expect(
        activateUserHandler('user-123', activationData, adminId)
      ).rejects.toThrow(AppError);
      await expect(
        activateUserHandler('user-123', activationData, adminId)
      ).rejects.toThrow('User is not suspended');
    });

    it('should continue if email sending fails', async () => {
      // Given: Valid suspended user but email service fails
      mockedUserRepository.findById.mockResolvedValue(mockSuspendedUser as any);
      mockedUserRepository.activateUser.mockResolvedValue(true);
      mockedEmailService.sendAccountActivatedEmail.mockRejectedValue(new Error('Email service error'));

      // When: Handler is called
      await expect(
        activateUserHandler('user-123', activationData, adminId)
      ).resolves.not.toThrow();

      // Then: User is still activated despite email failure
      expect(mockedUserRepository.activateUser).toHaveBeenCalled();
    });
  });

  describe('getUserSuspensionDetailsHandler', () => {
    it('should return suspension details for suspended user', async () => {
      // Given: Suspended user with details
      const suspendedUser = {
        id: 'user-123',
        status: 'SUSPENDED',
        suspensionReason: 'Terms violation',
        suspendedAt: new Date('2024-01-01'),
        suspendedBy: 'admin-123',
      };
      mockedUserRepository.findById.mockResolvedValue(suspendedUser as any);

      // When: Handler is called
      const result = await getUserSuspensionDetailsHandler('user-123');

      // Then: Correct suspension details are returned
      expect(result).toEqual({
        isSuspended: true,
        suspensionReason: 'Terms violation',
        suspendedAt: new Date('2024-01-01'),
        suspendedBy: 'admin-123',
      });
    });

    it('should return non-suspended details for active user', async () => {
      // Given: Active user
      const activeUser = {
        id: 'user-123',
        status: 'ACTIVE',
        suspensionReason: null,
        suspendedAt: null,
        suspendedBy: null,
      };
      mockedUserRepository.findById.mockResolvedValue(activeUser as any);

      // When: Handler is called
      const result = await getUserSuspensionDetailsHandler('user-123');

      // Then: Non-suspended details are returned
      expect(result).toEqual({
        isSuspended: false,
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspendedBy: undefined,
      });
    });

    it('should throw error if user not found', async () => {
      // Given: Non-existent user
      mockedUserRepository.findById.mockResolvedValue(null);

      // When & Then: Handler should throw error
      await expect(
        getUserSuspensionDetailsHandler('non-existent')
      ).rejects.toThrow(AppError);
      await expect(
        getUserSuspensionDetailsHandler('non-existent')
      ).rejects.toThrow('User not found');
    });
  });
});
