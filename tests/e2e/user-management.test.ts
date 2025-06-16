import { 
  createAuthenticatedApiClient 
} from '../helpers/api-client';
import { 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectUserShape,
  createRegularUser,
  createAdminUser,
  cleanupTestUsers 
} from '../helpers/test-helpers';

describe('User Story: User Management', () => {
  let regularUser: any;
  let adminUser: any;
  let regularApiClient: any;
  let adminApiClient: any;

  beforeEach(async () => {
    regularUser = await createRegularUser();
    adminUser = await createAdminUser();
    regularApiClient = createAuthenticatedApiClient(regularUser.token);
    adminApiClient = createAuthenticatedApiClient(adminUser.token);
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('As a regular user, I want to view my own profile details', () => {
    it('should successfully view own profile via users endpoint', async () => {
      // Given: An authenticated regular user
      // When: User requests their own profile via users/me endpoint
      const response = await regularApiClient.get('/api/users/me');

      // Then: Profile is returned successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User profile retrieved successfully');
      expect(response.body.data).toHaveProperty('user');
      
      // And: User data matches authenticated user
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.id).toBe(regularUser.id);
      expect(response.body.data.user.email).toBe(regularUser.email);
    });

    it('should reject unauthenticated access to user profile', async () => {
      // Given: No authentication
      const unauthenticatedClient = createAuthenticatedApiClient('invalid-token');

      // When: Unauthenticated request for profile
      const response = await unauthenticatedClient.get('/api/users/me');

      // Then: Request is rejected
      expectErrorResponse(response, 401);
    });
  });

  describe('As a regular user, I want to update my own profile', () => {
    it('should successfully update own profile via users endpoint', async () => {
      // Given: Valid profile update data
      const updateData = {
        name: 'Updated Regular User',
        bio: 'Updated bio via users endpoint',
      };

      // When: User updates their profile
      const response = await regularApiClient.put('/api/users/me', updateData);

      // Then: Profile is updated successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User profile updated successfully');
      
      // And: Updated data is reflected
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.bio).toBe(updateData.bio);
    });

    it('should validate update data', async () => {
      // Given: Invalid update data
      const invalidData = { name: '' };

      // When: User tries to update with invalid data
      const response = await regularApiClient.put('/api/users/me', invalidData);

      // Then: Update is rejected
      expectErrorResponse(response, 400);
    });

    it('should not allow users to update their role or status', async () => {
      // Given: Attempt to escalate privileges
      const maliciousData = {
        name: 'Hacker',
        role: 'ADMIN',
        status: 'SUSPENDED',
      };

      // When: User tries to update restricted fields
      const response = await regularApiClient.put('/api/users/me', maliciousData);

      // Then: Only allowed fields are updated
      expectSuccessResponse(response, 200);
      expect(response.body.data.user.role).toBe('USER'); // Role unchanged
      expect(response.body.data.user.status).toBe('ACTIVE'); // Status unchanged
      expect(response.body.data.user.name).toBe(maliciousData.name); // Name updated
    });
  });

  describe('As an admin, I want to view all users', () => {
    it('should successfully retrieve all users with pagination', async () => {
      // Given: Admin user and existing users in database
      // When: Admin requests all users
      const response = await adminApiClient.get('/api/admin/users');

      // Then: Users list is returned
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Users retrieved successfully');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      
      // And: Users array contains user data
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      
      // And: Each user has proper shape (no sensitive data)
      response.body.data.users.forEach((user: any) => {
        expectUserShape(user);
      });
    });

    it('should support pagination parameters', async () => {
      // Given: Admin user
      // When: Admin requests users with pagination
      const response = await adminApiClient.get('/api/admin/users?page=1&limit=1');

      // Then: Paginated results are returned
      expectSuccessResponse(response, 200);
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.users.length).toBeLessThanOrEqual(1);
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user (not admin)
      // When: Regular user tries to access admin endpoint
      const response = await regularApiClient.get('/api/admin/users');

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });

    it('should support filtering by role', async () => {
      // Given: Admin user
      // When: Admin filters users by role
      const response = await adminApiClient.get('/api/admin/users?role=USER');

      // Then: Only users with specified role are returned
      expectSuccessResponse(response, 200);
      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe('USER');
      });
    });
  });

  describe('As an admin, I want to view detailed user information', () => {
    it('should successfully retrieve specific user details', async () => {
      // Given: Admin user and target user ID
      // When: Admin requests specific user details
      const response = await adminApiClient.get(`/api/admin/users/${regularUser.id}`);

      // Then: User details are returned
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User retrieved successfully');
      expect(response.body.data).toHaveProperty('user');
      
      // And: Returned user matches requested user
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.id).toBe(regularUser.id);
      expect(response.body.data.user.email).toBe(regularUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      // Given: Non-existent user ID
      const nonExistentId = 'non-existent-id';

      // When: Admin requests non-existent user
      const response = await adminApiClient.get(`/api/admin/users/${nonExistentId}`);

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
      expect(response.body.error).toBe('User not found');
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user trying to access admin endpoint
      // When: Regular user tries to view user details
      const response = await regularApiClient.get(`/api/admin/users/${adminUser.id}`);

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });

  describe('As an admin, I want to suspend a user', () => {
    it('should successfully suspend an active user', async () => {
      // Given: An active user to suspend
      // When: Admin suspends the user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`);

      // Then: User is suspended successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User suspended successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.status).toBe('SUSPENDED');
    });

    it('should handle suspension of already suspended user', async () => {
      // Given: Already suspended user
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`);

      // When: Admin tries to suspend again
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`);

      // Then: Operation is handled gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      // Given: Non-existent user ID
      const nonExistentId = 'non-existent-id';

      // When: Admin tries to suspend non-existent user
      const response = await adminApiClient.post(`/api/admin/users/${nonExistentId}/suspend`);

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user trying to suspend someone
      // When: Regular user tries to suspend another user
      const response = await regularApiClient.post(`/api/admin/users/${adminUser.id}/suspend`);

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });

  describe('As an admin, I want to activate a suspended user', () => {
    it('should successfully activate a suspended user', async () => {
      // Given: A suspended user
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`);

      // When: Admin activates the user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`);

      // Then: User is activated successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User activated successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.status).toBe('ACTIVE');
    });

    it('should handle activation of already active user', async () => {
      // Given: Already active user
      // When: Admin tries to activate active user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`);

      // Then: Operation is handled gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      // Given: Non-existent user ID
      const nonExistentId = 'non-existent-id';

      // When: Admin tries to activate non-existent user
      const response = await adminApiClient.post(`/api/admin/users/${nonExistentId}/activate`);

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user trying to activate someone
      // When: Regular user tries to activate another user
      const response = await regularApiClient.post(`/api/admin/users/${adminUser.id}/activate`);

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });

  describe('As an admin, I want to delete a user', () => {
    it('should successfully soft delete a user', async () => {
      // Given: A user to delete
      // When: Admin deletes the user
      const response = await adminApiClient.delete(`/api/admin/users/${regularUser.id}`);

      // Then: User is deleted successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      // Given: Non-existent user ID
      const nonExistentId = 'non-existent-id';

      // When: Admin tries to delete non-existent user
      const response = await adminApiClient.delete(`/api/admin/users/${nonExistentId}`);

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user trying to delete someone
      // When: Regular user tries to delete another user
      const response = await regularApiClient.delete(`/api/admin/users/${adminUser.id}`);

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });

    it('should prevent admin from deleting themselves', async () => {
      // Given: Admin trying to delete their own account
      // When: Admin tries to delete themselves
      const response = await adminApiClient.delete(`/api/admin/users/${adminUser.id}`);

      // Then: Self-deletion is prevented
      expectErrorResponse(response, 400);
      expect(response.body.error).toContain('cannot delete your own account');
    });
  });
});
