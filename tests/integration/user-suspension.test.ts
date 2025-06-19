import { userRepository } from '@/repositories/user.repository';
import { EmailService } from '@/services/email.service';
import { 
  suspendUserHandler, 
  activateUserHandler, 
  getUserSuspensionDetailsHandler 
} from '@/handlers/user/user-suspension.handler';
import { 
  generateTestCredentials, 
  createTestUser, 
  cleanupTestUsers 
} from '../helpers/test-helpers';

describe('User Suspension Integration Tests', () => {
  let testUser: any;
  let adminUser: any;

  beforeAll(async () => {
    // Initialize email service for testing
    await EmailService.initialize();
  });

  beforeEach(async () => {
    // Create test users for each test
    const userCredentials = generateTestCredentials();
    const adminCredentials = generateTestCredentials();

    testUser = await createTestUser({
      email: userCredentials.email,
      name: userCredentials.name,
      role: 'USER',
      status: 'ACTIVE',
    });

    adminUser = await createTestUser({
      email: adminCredentials.email,
      name: adminCredentials.name,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('Suspension Workflow', () => {
    it('should complete full suspension workflow successfully', async () => {
      // Given: Active user
      expect(testUser.status).toBe('ACTIVE');

      // When: User is suspended
      const suspensionData = {
        reason: 'Integration test suspension',
      };

      await suspendUserHandler(testUser.id, suspensionData, adminUser.id);

      // Then: User should be suspended in database
      const suspendedUser = await userRepository.findById(testUser.id);
      expect(suspendedUser).toBeTruthy();
      expect(suspendedUser!.status).toBe('SUSPENDED');
      expect(suspendedUser!.suspensionReason).toBe(suspensionData.reason);
      expect(suspendedUser!.suspendedBy).toBe(adminUser.id);
      expect(suspendedUser!.suspendedAt).toBeTruthy();

      // And: Suspension details should be retrievable
      const suspensionDetails = await getUserSuspensionDetailsHandler(testUser.id);
      expect(suspensionDetails.isSuspended).toBe(true);
      expect(suspensionDetails.suspensionReason).toBe(suspensionData.reason);
      expect(suspensionDetails.suspendedBy).toBe(adminUser.id);
    });

    it('should complete full activation workflow successfully', async () => {
      // Given: Suspended user
      const suspensionData = { reason: 'Test suspension' };
      await suspendUserHandler(testUser.id, suspensionData, adminUser.id);

      // Verify user is suspended
      let userDetails = await getUserSuspensionDetailsHandler(testUser.id);
      expect(userDetails.isSuspended).toBe(true);

      // When: User is activated
      const activationData = {
        reason: 'Issue resolved - integration test',
      };

      await activateUserHandler(testUser.id, activationData, adminUser.id);

      // Then: User should be active in database
      const activatedUser = await userRepository.findById(testUser.id);
      expect(activatedUser).toBeTruthy();
      expect(activatedUser!.status).toBe('ACTIVE');
      expect(activatedUser!.suspensionReason).toBeNull();
      expect(activatedUser!.suspendedBy).toBeNull();
      expect(activatedUser!.suspendedAt).toBeNull();

      // And: Suspension details should reflect activation
      userDetails = await getUserSuspensionDetailsHandler(testUser.id);
      expect(userDetails.isSuspended).toBe(false);
      expect(userDetails.suspensionReason).toBeUndefined();
    });

    it('should handle multiple suspension cycles', async () => {
      const suspensionData1 = { reason: 'First suspension' };
      const activationData1 = { reason: 'First activation' };
      const suspensionData2 = { reason: 'Second suspension' };

      // First suspension cycle
      await suspendUserHandler(testUser.id, suspensionData1, adminUser.id);
      let user = await userRepository.findById(testUser.id);
      expect(user!.status).toBe('SUSPENDED');
      expect(user!.suspensionReason).toBe(suspensionData1.reason);

      // Activation
      await activateUserHandler(testUser.id, activationData1, adminUser.id);
      user = await userRepository.findById(testUser.id);
      expect(user!.status).toBe('ACTIVE');
      expect(user!.suspensionReason).toBeNull();

      // Second suspension
      await suspendUserHandler(testUser.id, suspensionData2, adminUser.id);
      user = await userRepository.findById(testUser.id);
      expect(user!.status).toBe('SUSPENDED');
      expect(user!.suspensionReason).toBe(suspensionData2.reason);
    });
  });

  describe('Email Notifications', () => {
    it('should send suspension email notification', async () => {
      // Given: Email service is working
      const emailSpy = jest.spyOn(EmailService, 'sendAccountSuspendedEmail');
      
      // When: User is suspended
      const suspensionData = { reason: 'Email notification test' };
      await suspendUserHandler(testUser.id, suspensionData, adminUser.id);

      // Then: Suspension email should be sent
      expect(emailSpy).toHaveBeenCalledWith({
        to: testUser.email,
        name: testUser.name,
        reason: suspensionData.reason,
        suspendedBy: adminUser.id,
      });

      emailSpy.mockRestore();
    });

    it('should send activation email notification', async () => {
      // Given: Suspended user and email service
      const suspensionData = { reason: 'Test suspension' };
      await suspendUserHandler(testUser.id, suspensionData, adminUser.id);

      const emailSpy = jest.spyOn(EmailService, 'sendAccountActivatedEmail');
      
      // When: User is activated
      const activationData = { reason: 'Email notification test' };
      await activateUserHandler(testUser.id, activationData, adminUser.id);

      // Then: Activation email should be sent
      expect(emailSpy).toHaveBeenCalledWith({
        to: testUser.email,
        name: testUser.name,
        reason: activationData.reason,
        activatedBy: adminUser.id,
      });

      emailSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle database transaction failures gracefully', async () => {
      // Given: Force database error by using invalid user ID
      const invalidUserId = 'invalid-user-id';
      const suspensionData = { reason: 'Database error test' };

      // When & Then: Should throw appropriate error
      await expect(
        suspendUserHandler(invalidUserId, suspensionData, adminUser.id)
      ).rejects.toThrow();
    });

    it('should continue operation if email service fails', async () => {
      // Given: Mock email service to fail
      const originalSendEmail = EmailService.sendAccountSuspendedEmail;
      EmailService.sendAccountSuspendedEmail = jest.fn().mockRejectedValue(new Error('Email service down'));

      // When: User is suspended
      const suspensionData = { reason: 'Email failure test' };
      
      // Then: Suspension should still succeed
      await expect(
        suspendUserHandler(testUser.id, suspensionData, adminUser.id)
      ).resolves.not.toThrow();

      // And: User should be suspended in database
      const user = await userRepository.findById(testUser.id);
      expect(user!.status).toBe('SUSPENDED');

      // Restore original function
      EmailService.sendAccountSuspendedEmail = originalSendEmail;
    });
  });

  describe('Business Rules Validation', () => {
    it('should prevent suspension of admin users', async () => {
      // Given: Admin user
      const suspensionData = { reason: 'Admin suspension test' };

      // When & Then: Should throw error
      await expect(
        suspendUserHandler(adminUser.id, suspensionData, adminUser.id)
      ).rejects.toThrow('Cannot suspend admin users');

      // And: Admin should remain active
      const user = await userRepository.findById(adminUser.id);
      expect(user!.status).toBe('ACTIVE');
    });

    it('should prevent double suspension', async () => {
      // Given: Already suspended user
      const suspensionData = { reason: 'First suspension' };
      await suspendUserHandler(testUser.id, suspensionData, adminUser.id);

      // When & Then: Second suspension should throw error
      await expect(
        suspendUserHandler(testUser.id, suspensionData, adminUser.id)
      ).rejects.toThrow('User is already suspended');
    });

    it('should prevent activation of non-suspended user', async () => {
      // Given: Active user (not suspended)
      expect(testUser.status).toBe('ACTIVE');

      // When & Then: Activation should throw error
      const activationData = { reason: 'Invalid activation' };
      await expect(
        activateUserHandler(testUser.id, activationData, adminUser.id)
      ).rejects.toThrow('User is not suspended');
    });
  });
});
