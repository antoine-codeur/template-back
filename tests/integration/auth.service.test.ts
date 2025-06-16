import { authService } from '@/services/auth.service';
import { 
  generateTestCredentials, 
  createTestUser, 
  cleanupTestUsers 
} from '../helpers/test-helpers';
import { AppError } from '@/middlewares/error.middleware';
import { HTTP_STATUS } from '@/config/constants';

describe('AuthService Integration Tests', () => {
  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Given: Valid registration credentials
      const credentials = generateTestCredentials();

      // When: Service registers the user
      const result = await authService.register(credentials);

      // Then: User is created with token
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(credentials.email);
      expect(result.user.name).toBe(credentials.name);
      expect(result.user.role).toBe('USER');
      expect(result.user.status).toBe('ACTIVE');
      expect(typeof result.token).toBe('string');
      
      // And: Sensitive data is not included
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error when email already exists', async () => {
      // Given: Existing user with same email
      const credentials = generateTestCredentials();
      await authService.register(credentials);

      // When & Then: Second registration should fail
      await expect(authService.register(credentials))
        .rejects
        .toThrow(AppError);
      
      try {
        await authService.register(credentials);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('Email is already registered');
        expect((error as AppError).statusCode).toBe(HTTP_STATUS.CONFLICT);
      }
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      // Given: Registered user
      const credentials = generateTestCredentials();
      await authService.register(credentials);

      // When: Service authenticates user
      const result = await authService.login({
        email: credentials.email,
        password: credentials.password,
      });

      // Then: Authentication succeeds
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(credentials.email);
      expect(typeof result.token).toBe('string');
      
      // And: lastLogin is updated
      expect(result.user.lastLogin).toBeTruthy();
    });

    it('should throw error with invalid credentials', async () => {
      // Given: Non-existent user credentials
      const credentials = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      };

      // When & Then: Authentication should fail
      await expect(authService.login(credentials))
        .rejects
        .toThrow(AppError);
      
      try {
        await authService.login(credentials);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe('Invalid credentials');
        expect((error as AppError).statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      }
    });

    it('should throw error when user is suspended', async () => {
      // Given: Suspended user
      const user = await createTestUser({
        email: 'suspended@test.com',
        name: 'Suspended User',
        status: 'SUSPENDED',
      });

      // When & Then: Login should fail
      await expect(authService.login({
        email: user.email,
        password: 'password',
      })).rejects.toThrow(AppError);
    });

    it('should throw error when user is deleted', async () => {
      // Given: Deleted user
      const user = await createTestUser({
        email: 'deleted@test.com',
        name: 'Deleted User',
        status: 'DELETED',
      });

      // When & Then: Login should fail
      await expect(authService.login({
        email: user.email,
        password: 'password',
      })).rejects.toThrow(AppError);
    });
  });

  describe('Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const credentials = generateTestCredentials();
      const result = await authService.register(credentials);
      testUser = result.user;
    });

    it('should retrieve user profile successfully', async () => {
      // When: Service gets user profile
      const profile = await authService.getProfile(testUser.id);

      // Then: Profile is returned
      expect(profile.id).toBe(testUser.id);
      expect(profile.email).toBe(testUser.email);
      expect(profile).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user profile', async () => {
      // When & Then: Getting non-existent profile should fail
      await expect(authService.getProfile('non-existent-id'))
        .rejects
        .toThrow(AppError);
    });

    it('should update user profile successfully', async () => {
      // Given: Profile update data
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio',
      };

      // When: Service updates profile
      const updatedProfile = await authService.updateProfile(testUser.id, updateData);

      // Then: Profile is updated
      expect(updatedProfile.name).toBe(updateData.name);
      expect(updatedProfile.bio).toBe(updateData.bio);
      expect(updatedProfile.id).toBe(testUser.id);
    });

    it('should throw error when updating non-existent user', async () => {
      // When & Then: Updating non-existent user should fail
      await expect(authService.updateProfile('non-existent-id', { name: 'Test' }))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('Password Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const credentials = generateTestCredentials();
      const result = await authService.register(credentials);
      testUser = result.user;
    });

    it('should change password successfully with valid current password', async () => {
      // Given: Valid password change request
      const currentPassword = 'SecurePassword123!';
      const newPassword = 'NewSecurePassword456!';

      // When: Service changes password
      await expect(authService.changePassword(testUser.id, currentPassword, newPassword))
        .resolves
        .not.toThrow();
    });

    it('should throw error with invalid current password', async () => {
      // Given: Invalid current password
      const wrongCurrentPassword = 'wrongpassword';
      const newPassword = 'NewSecurePassword456!';

      // When & Then: Password change should fail
      await expect(authService.changePassword(testUser.id, wrongCurrentPassword, newPassword))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('User Validation', () => {
    let testUser: any;

    beforeEach(async () => {
      const credentials = generateTestCredentials();
      const result = await authService.register(credentials);
      testUser = result.user;
    });

    it('should validate active user successfully', async () => {
      // When: Service validates user
      const validatedUser = await authService.validateUser(testUser.id);

      // Then: User is validated
      expect(validatedUser.id).toBe(testUser.id);
      expect(validatedUser.status).toBe('ACTIVE');
    });

    it('should throw error for non-existent user', async () => {
      // When & Then: Validating non-existent user should fail
      await expect(authService.validateUser('non-existent-id'))
        .rejects
        .toThrow(AppError);
    });

    it('should throw error for inactive user', async () => {
      // Given: Suspended user
      const suspendedUser = await createTestUser({
        email: 'suspended@test.com',
        name: 'Suspended User',
        status: 'SUSPENDED',
      });

      // When & Then: Validation should fail
      await expect(authService.validateUser(suspendedUser.id))
        .rejects
        .toThrow(AppError);
    });
  });
});
