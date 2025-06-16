import { 
  createAuthenticatedApiClient 
} from '../helpers/api-client';
import { 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectUserShape,
  createRegularUser,
  cleanupTestUsers 
} from '../helpers/test-helpers';

describe('User Story: Authenticated User Profile Management', () => {
  let authenticatedUser: any;
  let apiClient: any;

  beforeEach(async () => {
    authenticatedUser = await createRegularUser();
    apiClient = createAuthenticatedApiClient(authenticatedUser.token);
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('As an authenticated user, I want to view my profile', () => {
    it('should successfully retrieve user profile', async () => {
      // Given: An authenticated user
      // When: User requests their profile
      const response = await apiClient.get('/api/auth/me');

      // Then: Profile is returned successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data).toHaveProperty('user');
      
      // And: User data is properly formatted and matches authenticated user
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.id).toBe(authenticatedUser.id);
      expect(response.body.data.user.email).toBe(authenticatedUser.email);
      expect(response.body.data.user.name).toBe(authenticatedUser.name);
    });

    it('should reject unauthenticated profile requests', async () => {
      // Given: No authentication token
      const unauthenticatedClient = createAuthenticatedApiClient('invalid-token');

      // When: Request is made without valid authentication
      const response = await unauthenticatedClient.get('/api/auth/me');

      // Then: Request is rejected
      expectErrorResponse(response, 401);
    });
  });

  describe('As an authenticated user, I want to update my profile', () => {
    it('should successfully update profile with valid data', async () => {
      // Given: Valid profile update data
      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio description',
      };

      // When: User updates their profile
      const response = await apiClient.put('/api/auth/profile', updateData);

      // Then: Profile is updated successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data).toHaveProperty('user');
      
      // And: Updated data is reflected
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.bio).toBe(updateData.bio);
      expect(response.body.data.user.id).toBe(authenticatedUser.id);
    });

    it('should allow partial profile updates', async () => {
      // Given: Partial update data (only name)
      const updateData = { name: 'Only Name Updated' };

      // When: User updates only name
      const response = await apiClient.put('/api/auth/profile', updateData);

      // Then: Only name is updated
      expectSuccessResponse(response, 200);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.bio).toBe(authenticatedUser.bio || null);
    });

    it('should validate profile update data', async () => {
      // Given: Invalid update data (empty name)
      const invalidData = { name: '' };

      // When: User tries to update with invalid data
      const response = await apiClient.put('/api/auth/profile', invalidData);

      // Then: Update is rejected
      expectErrorResponse(response, 400);
    });

    it('should reject profile updates from unauthenticated users', async () => {
      // Given: Invalid authentication
      const unauthenticatedClient = createAuthenticatedApiClient('invalid-token');
      const updateData = { name: 'Hacker Name' };

      // When: Unauthenticated user tries to update profile
      const response = await unauthenticatedClient.put('/api/auth/profile', updateData);

      // Then: Update is rejected
      expectErrorResponse(response, 401);
    });
  });

  describe('As an authenticated user, I want to change my password', () => {
    it('should successfully change password with valid current password', async () => {
      // Given: Valid password change data
      const passwordData = {
        currentPassword: 'password', // Default password from test helper
        newPassword: 'NewSecurePassword123!',
      };

      // When: User changes their password
      const response = await apiClient.put('/api/auth/change-password', passwordData);

      // Then: Password is changed successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject password change with incorrect current password', async () => {
      // Given: Incorrect current password
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewSecurePassword123!',
      };

      // When: User tries to change password
      const response = await apiClient.put('/api/auth/change-password', passwordData);

      // Then: Password change is rejected
      expectErrorResponse(response, 400);
      expect(response.body.error).toBe('Invalid current password');
    });

    it('should reject password change with weak new password', async () => {
      // Given: Weak new password
      const passwordData = {
        currentPassword: 'password',
        newPassword: '123',
      };

      // When: User tries to change to weak password
      const response = await apiClient.put('/api/auth/change-password', passwordData);

      // Then: Password change is rejected
      expectErrorResponse(response, 400);
    });

    it('should reject password change from unauthenticated users', async () => {
      // Given: Invalid authentication
      const unauthenticatedClient = createAuthenticatedApiClient('invalid-token');
      const passwordData = {
        currentPassword: 'password',
        newPassword: 'NewPassword123!',
      };

      // When: Unauthenticated user tries to change password
      const response = await unauthenticatedClient.put('/api/auth/change-password', passwordData);

      // Then: Request is rejected
      expectErrorResponse(response, 401);
    });

    it('should require both current and new password', async () => {
      // Given: Missing new password
      const incompleteData = { currentPassword: 'password' };

      // When: User tries to change password with incomplete data
      const response = await apiClient.put('/api/auth/change-password', incompleteData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
    });
  });

  describe('As an authenticated user, I want to logout', () => {
    it('should successfully logout', async () => {
      // Given: An authenticated user
      // When: User logs out
      const response = await apiClient.post('/api/auth/logout');

      // Then: Logout is successful
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should handle logout for unauthenticated users gracefully', async () => {
      // Given: No authentication token
      const unauthenticatedClient = createAuthenticatedApiClient('invalid-token');

      // When: Unauthenticated user tries to logout
      const response = await unauthenticatedClient.post('/api/auth/logout');

      // Then: Request is handled gracefully (depending on implementation)
      // Note: This behavior depends on your implementation choice
      expect([200, 401]).toContain(response.status);
    });
  });
});
