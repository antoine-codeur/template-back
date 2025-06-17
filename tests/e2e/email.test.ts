import { 
  createApiClient, 
  createAuthenticatedApiClient 
} from '../helpers/api-client';
import { 
  generateTestCredentials, 
  expectSuccessResponse, 
  expectErrorResponse, 
  createRegularUser,
  createAdminUser,
  cleanupTestUsers 
} from '../helpers/test-helpers';
import { EmailRepository } from '@/repositories/email.repository';

describe('User Story: Email System', () => {
  const apiClient = createApiClient();
  let regularUser: any;
  let adminUser: any;
  let regularApiClient: any;
  let adminApiClient: any;

  beforeAll(async () => {
    // Create test users
    regularUser = await createRegularUser();
    adminUser = await createAdminUser();
    
    // Create authenticated API clients
    regularApiClient = createAuthenticatedApiClient(regularUser.token);
    adminApiClient = createAuthenticatedApiClient(adminUser.token);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe('As a user, I want to verify my email address', () => {
    it('should send verification email to authenticated user', async () => {
      // Given: Authenticated user with unverified email
      expect(regularUser.emailVerified).toBeFalsy();

      // When: User requests email verification
      const response = await regularApiClient.post('/api/email/send-verification');

      // Then: Verification email is sent
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Verification email sent successfully');
    });

    it('should reject verification request from unauthenticated user', async () => {
      // Given: Unauthenticated request
      // When: User tries to send verification email
      const response = await apiClient.post('/api/email/send-verification');

      // Then: Request is rejected
      expectErrorResponse(response, 401);
    });

    it('should verify email with valid token', async () => {
      // Given: Valid verification token
      const token = await EmailRepository.generateToken(regularUser.id, 'EMAIL_VERIFICATION');

      // When: User verifies email with token
      const response = await apiClient.post('/api/email/verify', {
        token: token,
      });

      // Then: Email is verified
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should reject invalid verification token', async () => {
      // Given: Invalid token
      const invalidToken = 'invalid-token-12345';

      // When: User tries to verify with invalid token
      const response = await apiClient.post('/api/email/verify', {
        token: invalidToken,
      });

      // Then: Verification is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid or expired verification token');
    });

    it('should reject malformed verification request', async () => {
      // Given: Malformed request data
      const malformedData = { invalidField: 'test' };

      // When: User sends malformed verification request
      const response = await apiClient.post('/api/email/verify', malformedData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid request data');
    });
  });

  describe('As a user, I want to reset my password via email', () => {
    it('should send password reset email for existing user', async () => {
      // Given: Existing user email
      const resetData = { email: regularUser.email };

      // When: User requests password reset
      const response = await apiClient.post('/api/email/password-reset/send', resetData);

      // Then: Reset email is sent (or appears to be sent for security)
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('If an account with this email exists, a password reset link has been sent.');
    });

    it('should handle non-existent email securely', async () => {
      // Given: Non-existent email
      const resetData = { email: 'nonexistent@example.com' };

      // When: User requests password reset
      const response = await apiClient.post('/api/email/password-reset/send', resetData);

      // Then: Same success message is returned (security)
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('If an account with this email exists, a password reset link has been sent.');
    });

    it('should validate password reset token', async () => {
      // Given: Valid reset token
      const token = await EmailRepository.generateToken(regularUser.id, 'PASSWORD_RESET');

      // When: User validates reset token
      const response = await apiClient.post('/api/email/password-reset/validate', {
        token: token,
      });

      // Then: Token is validated
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Token is valid');
    });

    it('should reject invalid reset token validation', async () => {
      // Given: Invalid reset token
      const invalidToken = 'invalid-reset-token';

      // When: User tries to validate invalid token
      const response = await apiClient.post('/api/email/password-reset/validate', {
        token: invalidToken,
      });

      // Then: Validation is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should reset password with valid token', async () => {
      // Given: Valid reset token and new password
      const token = await EmailRepository.generateToken(regularUser.id, 'PASSWORD_RESET');
      const resetData = {
        token: token,
        password: 'newSecurePassword123!',
        confirmPassword: 'newSecurePassword123!',
      };

      // When: User resets password
      const response = await apiClient.post('/api/email/password-reset/confirm', resetData);

      // Then: Password is reset
      expectSuccessResponse(response, 200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should reject password reset with invalid token', async () => {
      // Given: Invalid token and new password
      const resetData = {
        token: 'invalid-token',
        password: 'newSecurePassword123!',
        confirmPassword: 'newSecurePassword123!',
      };

      // When: User tries to reset password
      const response = await apiClient.post('/api/email/password-reset/confirm', resetData);

      // Then: Reset is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should reject weak password in reset', async () => {
      // Given: Valid token but weak password
      const token = await EmailRepository.generateToken(regularUser.id, 'PASSWORD_RESET');
      const resetData = {
        token: token,
        password: '123', // Weak password
        confirmPassword: '123',
      };

      // When: User tries to reset with weak password
      const response = await apiClient.post('/api/email/password-reset/confirm', resetData);

      // Then: Reset is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid request data');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on email verification requests', async () => {
      // Given: Multiple rapid verification requests
      const responses = [];

      // When: User makes multiple rapid requests (more than rate limit)
      for (let i = 0; i < 5; i++) {
        const response = await regularApiClient.post('/api/email/send-verification');
        responses.push(response);
      }

      // Then: Some requests are rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on password reset requests', async () => {
      // Given: Multiple rapid reset requests
      const resetData = { email: regularUser.email };
      const responses = [];

      // When: User makes multiple rapid requests (more than rate limit)
      for (let i = 0; i < 5; i++) {
        const response = await apiClient.post('/api/email/password-reset/send', resetData);
        responses.push(response);
      }

      // Then: Some requests are rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on email verification attempts', async () => {
      // Given: Multiple rapid verification attempts
      const responses = [];

      // When: User makes multiple verification attempts
      for (let i = 0; i < 12; i++) {
        const response = await apiClient.post('/api/email/verify', {
          token: 'invalid-token-' + i,
        });
        responses.push(response);
      }

      // Then: Some requests are rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format in password reset', async () => {
      // Given: Invalid email format
      const invalidData = { email: 'not-an-email' };

      // When: User requests reset with invalid email
      const response = await apiClient.post('/api/email/password-reset/send', invalidData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid request data');
    });

    it('should validate token format in verification', async () => {
      // Given: Empty token
      const invalidData = { token: '' };

      // When: User tries to verify with empty token
      const response = await apiClient.post('/api/email/verify', invalidData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid request data');
    });

    it('should validate password requirements in reset', async () => {
      // Given: Valid token but mismatched passwords
      const token = await EmailRepository.generateToken(regularUser.id, 'PASSWORD_RESET');
      const invalidData = {
        token: token,
        password: 'password1',
        confirmPassword: 'password2', // Mismatch
      };

      // When: User tries to reset with mismatched passwords
      const response = await apiClient.post('/api/email/password-reset/confirm', invalidData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
    });

    it('should require all fields in password reset', async () => {
      // Given: Incomplete reset data
      const incompleteData = { token: 'some-token' }; // Missing password fields

      // When: User submits incomplete reset form
      const response = await apiClient.post('/api/email/password-reset/confirm', incompleteData);

      // Then: Request is rejected
      expectErrorResponse(response, 400);
      expect(response.body.message).toBe('Invalid request data');
    });
  });

  describe('Security Features', () => {
    it('should prevent token reuse', async () => {
      // Given: Valid verification token
      const token = await EmailRepository.generateToken(regularUser.id, 'EMAIL_VERIFICATION');

      // When: Token is used once
      const firstResponse = await apiClient.post('/api/email/verify', { token });
      expectSuccessResponse(firstResponse, 200);

      // And: Same token is used again
      const secondResponse = await apiClient.post('/api/email/verify', { token });

      // Then: Second use is rejected
      expectErrorResponse(secondResponse, 400);
      expect(secondResponse.body.message).toBe('Invalid or expired verification token');
    });

    it('should prevent reset token reuse', async () => {
      // Given: Valid reset token
      const token = await EmailRepository.generateToken(regularUser.id, 'PASSWORD_RESET');
      const resetData = {
        token: token,
        password: 'newPassword123!',
        confirmPassword: 'newPassword123!',
      };

      // When: Token is used once
      const firstResponse = await apiClient.post('/api/email/password-reset/confirm', resetData);
      expectSuccessResponse(firstResponse, 200);

      // And: Same token is used again
      const secondResponse = await apiClient.post('/api/email/password-reset/confirm', resetData);

      // Then: Second use is rejected
      expectErrorResponse(secondResponse, 400);
      expect(secondResponse.body.message).toBe('Invalid or expired reset token');
    });

    it('should handle concurrent token usage safely', async () => {
      // Given: Valid token
      const token = await EmailRepository.generateToken(regularUser.id, 'EMAIL_VERIFICATION');

      // When: Multiple concurrent verification attempts
      const promises = Array(3).fill(null).map(() => 
        apiClient.post('/api/email/verify', { token })
      );
      const responses = await Promise.all(promises);

      // Then: Only one should succeed
      const successResponses = responses.filter(r => r.status === 200);
      const errorResponses = responses.filter(r => r.status !== 200);
      
      expect(successResponses.length).toBe(1);
      expect(errorResponses.length).toBe(2);
    });
  });
});
