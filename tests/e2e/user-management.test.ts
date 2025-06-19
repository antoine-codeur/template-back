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
    it('should successfully suspend an active user with reason', async () => {
      // Given: An active user and suspension reason
      const suspensionData = {
        reason: 'Violation of community guidelines',
      };

      // When: Admin suspends the user with reason
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, suspensionData);

      // Then: User is suspended successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User suspended successfully');
    });

    it('should successfully suspend an active user', async () => {
      // Given: An active user to suspend
      // When: Admin suspends the user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'E2E test suspension',
      });

      // Then: User is suspended successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User suspended successfully');
    });

    it('should validate suspension reason length', async () => {
      // Given: Suspension data with invalid reason (too short)
      const shortReasonData = {
        reason: 'Too',
      };

      // When: Admin tries to suspend with invalid reason
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, shortReasonData);

      // Then: Request is rejected with validation error
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid input data');
    });

    it('should validate suspension reason length (too long)', async () => {
      // Given: Suspension data with reason too long
      const longReasonData = {
        reason: 'a'.repeat(501), // 501 characters, exceeds 500 limit
      };

      // When: Admin tries to suspend with long reason
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, longReasonData);

      // Then: Request is rejected with validation error
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid input data');
    });

    it('should prevent admin from suspending themselves', async () => {
      // Given: Admin user and suspension data
      const suspensionData = {
        reason: 'Self-suspension attempt',
      };

      // When: Admin tries to suspend themselves
      const response = await adminApiClient.post(`/api/admin/users/${adminUser.id}/suspend`, suspensionData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Cannot suspend your own account');
    });

    it('should handle suspension of already suspended user', async () => {
      // Given: Already suspended user
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'First suspension',
      });

      // When: Admin tries to suspend again
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'Second suspension',
      });

      // Then: Operation is handled gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      // Given: Non-existent user ID (valid UUID format)
      const nonExistentId = '12345678-1234-5234-9234-123456789012';

      // When: Admin tries to suspend non-existent user
      const response = await adminApiClient.post(`/api/admin/users/${nonExistentId}/suspend`, {
        reason: 'Test suspension',
      });

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject invalid user ID format', async () => {
      // Given: Invalid user ID format
      const invalidId = 'invalid-id-format';

      // When: Admin tries to suspend with invalid ID
      const response = await adminApiClient.post(`/api/admin/users/${invalidId}/suspend`, {
        reason: 'Test suspension',
      });

      // Then: Bad request error is returned
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should reject access from non-admin users', async () => {
      // Given: Regular user trying to suspend someone
      // When: Regular user tries to suspend another user
      const response = await regularApiClient.post(`/api/admin/users/${adminUser.id}/suspend`, {
        reason: 'Unauthorized suspension',
      });

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });

  describe('As an admin, I want to activate a suspended user', () => {
    it('should successfully activate a suspended user with reason', async () => {
      // Given: A suspended user
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'Initial suspension for testing',
      });

      // When: Admin activates the user with reason
      const activationData = {
        reason: 'Issue resolved, user education completed',
      };
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`, activationData);

      // Then: User is activated successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User activated successfully');
    });

    it('should successfully activate a suspended user', async () => {
      // Given: A suspended user
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'E2E test suspension',
      });

      // When: Admin activates the user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`, {
        reason: 'E2E test activation',
      });

      // Then: User is activated successfully
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('User activated successfully');
    });

    it('should validate activation reason length (too long)', async () => {
      // Given: Suspended user and activation data with reason too long
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: 'Test suspension',
      });

      const longReasonData = {
        reason: 'a'.repeat(501), // 501 characters, exceeds 500 limit
      };

      // When: Admin tries to activate with long reason
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`, longReasonData);

      // Then: Request is rejected with validation error
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid input data');
    });

    it('should handle activation of already active user', async () => {
      // Given: Already active user
      // When: Admin tries to activate active user
      const response = await adminApiClient.post(`/api/admin/users/${regularUser.id}/activate`, {
        reason: 'Trying to activate active user',
      });

      // Then: Operation is handled gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should return 404 for non-existent user activation', async () => {
      // Given: Non-existent user ID (valid UUID format)
      const nonExistentId = '12345678-1234-5234-9234-123456789012';

      // When: Admin tries to activate non-existent user
      const response = await adminApiClient.post(`/api/admin/users/${nonExistentId}/activate`, {
        reason: 'Test activation',
      });

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject invalid user ID format for activation', async () => {
      // Given: Invalid user ID format
      const invalidId = 'invalid-id-format';

      // When: Admin tries to activate with invalid ID
      const response = await adminApiClient.post(`/api/admin/users/${invalidId}/activate`, {
        reason: 'Test activation',
      });

      // Then: Bad request error is returned
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should reject access from non-admin users for activation', async () => {
      // Given: Regular user trying to activate someone
      // When: Regular user tries to activate another user
      const response = await regularApiClient.post(`/api/admin/users/${adminUser.id}/activate`, {
        reason: 'Unauthorized activation',
      });

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });

  describe('As an admin, I want to view user suspension details', () => {
    it('should retrieve suspension details for suspended user', async () => {
      // Given: A suspended user
      const suspensionReason = 'Community guidelines violation';
      await adminApiClient.post(`/api/admin/users/${regularUser.id}/suspend`, {
        reason: suspensionReason,
      });

      // When: Admin requests suspension details
      const response = await adminApiClient.get(`/api/admin/users/${regularUser.id}/suspension`);

      // Then: Suspension details are returned
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Suspension details retrieved successfully');
      expect(response.body.data.isSuspended).toBe(true);
      expect(response.body.data.suspensionReason).toBe(suspensionReason);
      expect(response.body.data.suspendedAt).toBeTruthy();
      expect(response.body.data.suspendedBy).toBeTruthy();
    });

    it('should retrieve suspension details for active user', async () => {
      // Given: An active (non-suspended) user
      // When: Admin requests suspension details
      const response = await adminApiClient.get(`/api/admin/users/${regularUser.id}/suspension`);

      // Then: Non-suspended details are returned
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Suspension details retrieved successfully');
      expect(response.body.data.isSuspended).toBe(false);
      expect(response.body.data.suspensionReason).toBeUndefined();
      expect(response.body.data.suspendedAt).toBeUndefined();
      expect(response.body.data.suspendedBy).toBeUndefined();
    });

    it('should return 404 for non-existent user suspension details', async () => {
      // Given: Non-existent user ID (valid UUID format)
      const nonExistentId = '12345678-1234-5234-9234-123456789012';

      // When: Admin tries to get suspension details for non-existent user
      const response = await adminApiClient.get(`/api/admin/users/${nonExistentId}/suspension`);

      // Then: Not found error is returned
      expectErrorResponse(response, 404);
    });

    it('should reject invalid user ID format for suspension details', async () => {
      // Given: Invalid user ID format
      const invalidId = 'invalid-id-format';

      // When: Admin requests suspension details with invalid ID
      const response = await adminApiClient.get(`/api/admin/users/${invalidId}/suspension`);

      // Then: Bad request error is returned
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid user ID format');
    });

    it('should reject access from non-admin users for suspension details', async () => {
      // Given: Regular user trying to view suspension details
      // When: Regular user tries to view suspension details
      const response = await regularApiClient.get(`/api/admin/users/${adminUser.id}/suspension`);

      // Then: Access is denied
      expectErrorResponse(response, 403);
    });
  });
});
