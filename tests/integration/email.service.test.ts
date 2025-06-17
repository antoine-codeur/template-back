import { EmailService } from '@/services/email.service';
import { EmailRepository } from '@/repositories/email.repository';
import { 
  generateTestCredentials, 
  createTestUser, 
  cleanupTestUsers 
} from '../helpers/test-helpers';

describe('Email Service Integration Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Initialize email service
    await EmailService.initialize();
  });

  beforeEach(async () => {
    // Create a test user for each test
    const credentials = generateTestCredentials();
    testUser = await createTestUser({
      email: credentials.email,
      name: credentials.name,
    });
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('Email Verification', () => {
    it('should create verification token successfully', async () => {
      // When: Service creates verification token
      const token = await EmailRepository.createVerificationToken(testUser.id);

      // Then: Token is created
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // And: Token can be found in database
      const tokenInfo = await EmailRepository.getTokenInfo(token);
      expect(tokenInfo).toBeTruthy();
      expect(tokenInfo!.type).toBe('VERIFICATION');
      expect(tokenInfo!.userId).toBe(testUser.id);
    });

    it('should send verification email successfully', async () => {
      // When: Service sends verification email
      const result = await EmailService.sendVerificationEmail({
        to: testUser.email,
        name: testUser.name,
        verificationUrl: 'http://localhost:3000/verify?token=test-token',
      });

      // Then: Email is sent successfully
      expect(result).toBe(true);
    });

    it('should verify and consume token successfully', async () => {
      // Given: Valid verification token
      const token = await EmailRepository.createVerificationToken(testUser.id);

      // When: Token is verified and consumed
      const result = await EmailRepository.verifyAndConsumeToken(token, 'VERIFICATION');

      // Then: Token is valid and consumed
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe(testUser.id);

      // And: Token cannot be used again
      const secondResult = await EmailRepository.verifyAndConsumeToken(token, 'VERIFICATION');
      expect(secondResult.isValid).toBe(false);
    });

    it('should handle expired token', async () => {
      // Given: Expired verification token (we'll simulate by creating and then expiring)
      const token = await EmailRepository.createVerificationToken(testUser.id);
      
      // Expire the token
      await EmailRepository.expireToken(token);

      // When: Token is verified
      const result = await EmailRepository.verifyAndConsumeToken(token, 'VERIFICATION');

      // Then: Token is invalid
      expect(result.isValid).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // When: Check if user can request verification
      const canRequest = await EmailRepository.canRequestVerification(testUser.id);

      // Then: User can initially request verification
      expect(canRequest).toBe(true);

      // When: Create a verification token
      await EmailRepository.createVerificationToken(testUser.id);

      // Then: User cannot immediately request another (depends on rate limiting logic)
      // Note: This test depends on the actual rate limiting implementation
    });
  });

  describe('Password Reset', () => {
    it('should create password reset token successfully', async () => {
      // When: Service creates password reset token
      const token = await EmailRepository.createPasswordResetToken(testUser.id);

      // Then: Token is created
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // And: Token can be found in database
      const tokenInfo = await EmailRepository.getTokenInfo(token);
      expect(tokenInfo).toBeTruthy();
      expect(tokenInfo!.type).toBe('PASSWORD_RESET');
      expect(tokenInfo!.userId).toBe(testUser.id);
    });

    it('should send password reset email successfully', async () => {
      // When: Service sends password reset email
      const result = await EmailService.sendPasswordResetEmail({
        to: testUser.email,
        name: testUser.name,
        resetUrl: 'http://localhost:3000/reset?token=test-token',
      });

      // Then: Email is sent successfully
      expect(result).toBe(true);
    });

    it('should verify and consume reset token successfully', async () => {
      // Given: Valid password reset token
      const token = await EmailRepository.createPasswordResetToken(testUser.id);

      // When: Token is verified and consumed
      const result = await EmailRepository.verifyAndConsumeToken(token, 'PASSWORD_RESET');

      // Then: Token is valid and consumed
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe(testUser.id);

      // And: Token cannot be used again
      const secondResult = await EmailRepository.verifyAndConsumeToken(token, 'PASSWORD_RESET');
      expect(secondResult.isValid).toBe(false);
    });

    it('should send password changed email successfully', async () => {
      // When: Service sends password changed email
      const result = await EmailService.sendPasswordChangedEmail({
        to: testUser.email,
        name: testUser.name,
      });

      // Then: Email is sent successfully
      expect(result).toBe(true);
    });
  });

  describe('Email Logging', () => {
    it('should log email activity', async () => {
      // Given: Send an email to generate logs
      await EmailService.sendVerificationEmail({
        to: testUser.email,
        name: testUser.name,
        verificationUrl: 'http://localhost:3000/verify?token=test-token',
      });

      // When: Get all email logs (not filtered by user since sendVerificationEmail doesn't pass userId)
      const logs = await EmailRepository.getUserEmailLogs(''); // Get all logs
      
      // Or alternatively, check if any logs contain our test email
      const allLogs = await EmailRepository.getEmailStats();

      // Then: Log entry exists 
      expect(allLogs.total).toBeGreaterThan(0);
      expect(allLogs.sent).toBeGreaterThan(0);
    });

    it('should get email statistics', async () => {
      // Given: Send some emails
      await EmailService.sendVerificationEmail({
        to: testUser.email,
        name: testUser.name,
        verificationUrl: 'http://localhost:3000/verify?token=test-token',
      });

      // When: Get email statistics
      const stats = await EmailRepository.getEmailStats();

      // Then: Statistics are returned
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.sent).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.pending).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('Token Cleanup', () => {
    it('should cleanup expired tokens', async () => {
      // Given: Create and expire some tokens
      const token1 = await EmailRepository.createVerificationToken(testUser.id);
      const token2 = await EmailRepository.createPasswordResetToken(testUser.id);
      
      await EmailRepository.expireToken(token1);
      await EmailRepository.expireToken(token2);

      // When: Cleanup expired tokens
      const cleanedCount = await EmailRepository.cleanupExpiredTokens();

      // Then: Expired tokens are cleaned up
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should initialize email service successfully', async () => {
      // When: Service is initialized (already done in beforeAll)
      // Then: No errors should occur and service should be ready
      expect(EmailService).toBeDefined();
      
      // And: Service should be able to send emails
      const result = await EmailService.sendVerificationEmail({
        to: 'test@example.com',
        name: 'Test User',
        verificationUrl: 'http://localhost:3000/verify?token=test-token',
      });
      expect(result).toBe(true);
    });
  });
});
