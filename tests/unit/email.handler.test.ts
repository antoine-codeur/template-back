import { Response } from 'express';
import { 
  sendEmailVerificationHandler,
  verifyEmailHandler 
} from '@/handlers/email/email-verification.handler';
import { 
  sendPasswordResetHandler,
  resetPasswordHandler,
  validateResetTokenHandler 
} from '@/handlers/email/password-reset.handler';
import { EmailService } from '@/services/email.service';
import { EmailRepository } from '@/repositories/email.repository';
import { userRepository } from '@/repositories/user.repository';
import { authRepository } from '@/repositories/auth.repository';
import { HTTP_STATUS } from '@/config/constants';

// Mock all dependencies
jest.mock('@/services/email.service');
jest.mock('@/repositories/email.repository');
jest.mock('@/repositories/user.repository');
jest.mock('@/repositories/auth.repository');
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedEmailService = EmailService as jest.Mocked<typeof EmailService>;
const mockedEmailRepository = EmailRepository as jest.Mocked<typeof EmailRepository>;
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedAuthRepository = authRepository as jest.Mocked<typeof authRepository>;

describe('Email Handlers Unit Tests', () => {
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Email Verification Handlers', () => {
    describe('sendEmailVerificationHandler', () => {
      it('should send verification email successfully', async () => {
        // Given: Valid user ID and mocked services
        const userId = 'test-user-id';
        const mockUser = {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: false,
        };

        mockedUserRepository.findById.mockResolvedValue(mockUser as any);
        mockedEmailRepository.canRequestVerification.mockResolvedValue(true);
        mockedEmailRepository.createVerificationToken.mockResolvedValue('verification-token');
        mockedEmailService.sendVerificationEmail.mockResolvedValue(true);

        // When: Handler is called
        await sendEmailVerificationHandler(userId, mockResponse as Response);

        // Then: Verification email is sent
        expect(mockedUserRepository.findById).toHaveBeenCalledWith(userId);
        expect(mockedEmailRepository.canRequestVerification).toHaveBeenCalledWith(userId);
        expect(mockedEmailRepository.createVerificationToken).toHaveBeenCalledWith(userId);
        expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'Verification email sent successfully',
          data: {},
        });
      });

      it('should handle user not found', async () => {
        // Given: Non-existent user ID
        const userId = 'non-existent-user';
        mockedUserRepository.findById.mockResolvedValue(null);

        // When: Handler is called
        await sendEmailVerificationHandler(userId, mockResponse as Response);

        // Then: Error response is sent
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'User not found',
          error: 'User not found',
        });
      });

      it('should handle already verified email', async () => {
        // Given: User with already verified email
        const userId = 'test-user-id';
        const mockUser = {
          id: userId,
          email: 'test@example.com',
          emailVerified: true,
        };

        mockedUserRepository.findById.mockResolvedValue(mockUser as any);

        // When: Handler is called
        await sendEmailVerificationHandler(userId, mockResponse as Response);

        // Then: Success response is sent (already verified)
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'Email is already verified',
          data: {},
        });
      });

      it('should handle rate limiting', async () => {
        // Given: User with recent verification attempt
        const userId = 'test-user-id';
        const mockUser = {
          id: userId,
          email: 'test@example.com',
          emailVerified: false,
        };

        mockedUserRepository.findById.mockResolvedValue(mockUser as any);
        mockedEmailRepository.canRequestVerification.mockResolvedValue(false);

        // When: Handler is called
        await sendEmailVerificationHandler(userId, mockResponse as Response);

        // Then: Rate limit error is sent
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'Too many verification emails sent. Please wait before requesting another.',
          error: 'Too many verification emails sent. Please wait before requesting another.',
        });
      });
    });

    describe('verifyEmailHandler', () => {
      it('should verify email successfully', async () => {
        // Given: Valid token
        const token = 'valid-verification-token';
        const userId = 'test-user-id';
        const mockResult = {
          isValid: true,
          userId,
        };

        mockedEmailRepository.verifyAndConsumeToken.mockResolvedValue(mockResult);
        mockedUserRepository.updateEmailVerification.mockResolvedValue(true);

        // When: Handler is called
        await verifyEmailHandler(token, mockResponse as Response);

        // Then: Email is verified
        expect(mockedEmailRepository.verifyAndConsumeToken).toHaveBeenCalledWith(token, 'VERIFICATION');
        expect(mockedUserRepository.updateEmailVerification).toHaveBeenCalledWith(userId, true);
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'Email verified successfully',
          data: {},
        });
      });

      it('should handle invalid token', async () => {
        // Given: Invalid token
        const token = 'invalid-token';
        const mockResult = {
          userId: '',
          isValid: false,
        };

        mockedEmailRepository.verifyAndConsumeToken.mockResolvedValue(mockResult);

        // When: Handler is called
        await verifyEmailHandler(token, mockResponse as Response);

        // Then: Error response is sent
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid or expired verification token',
          error: 'Invalid or expired verification token',
        });
      });
    });
  });

  describe('Password Reset Handlers', () => {
    describe('sendPasswordResetHandler', () => {
      it('should send password reset email successfully', async () => {
        // Given: Valid email and user exists
        const resetRequest = { email: 'test@example.com' };
        const mockUser = {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          status: 'ACTIVE',
        };

        mockedUserRepository.findByEmail.mockResolvedValue(mockUser as any);
        mockedEmailRepository.canRequestVerification.mockResolvedValue(true);
        mockedEmailRepository.createPasswordResetToken.mockResolvedValue('reset-token');
        mockedEmailService.sendPasswordResetEmail.mockResolvedValue(true);

        // When: Handler is called
        await sendPasswordResetHandler(resetRequest, mockResponse as Response);

        // Then: Reset email is sent
        expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(resetRequest.email);
        expect(mockedEmailRepository.canRequestVerification).toHaveBeenCalledWith(mockUser.id);
        expect(mockedEmailRepository.createPasswordResetToken).toHaveBeenCalledWith(mockUser.id);
        expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
          data: {},
        });
      });

      it('should handle non-existent user securely', async () => {
        // Given: Non-existent email
        const resetRequest = { email: 'nonexistent@example.com' };
        mockedUserRepository.findByEmail.mockResolvedValue(null);

        // When: Handler is called
        await sendPasswordResetHandler(resetRequest, mockResponse as Response);

        // Then: Same success message is sent (security)
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
          data: {},
        });
        expect(mockedEmailService.sendEmail).not.toHaveBeenCalled();
      });
    });

    describe('resetPasswordHandler', () => {
      it('should reset password successfully', async () => {
        // Given: Valid token and new password
        const token = 'valid-reset-token';
        const newPassword = 'newPassword123!';
        const userId = 'test-user-id';
        const mockUser = { id: userId, email: 'test@example.com', status: 'ACTIVE' };
        
        mockedEmailRepository.verifyAndConsumeToken.mockResolvedValue({
          isValid: true,
          userId,
        });
        mockedUserRepository.findById.mockResolvedValue(mockUser as any);
        mockedAuthRepository.updatePassword.mockResolvedValue(true);
        mockedEmailService.sendEmail.mockResolvedValue(true);

        // When: Handler is called
        await resetPasswordHandler(token, newPassword, mockResponse as Response);

        // Then: Password is reset
        expect(mockedEmailRepository.verifyAndConsumeToken).toHaveBeenCalledWith(token, 'PASSWORD_RESET');
        expect(mockedAuthRepository.updatePassword).toHaveBeenCalledWith(userId, newPassword);
        expect(mockedEmailService.sendPasswordChangedEmail).toHaveBeenCalled(); // Confirmation email
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'Password reset successfully',
          data: {},
        });
      });

      it('should handle invalid reset token', async () => {
        // Given: Invalid token
        const token = 'invalid-token';
        const newPassword = 'newPassword123!';
        
        mockedEmailRepository.verifyAndConsumeToken.mockResolvedValue({
          userId: '',
          isValid: false,
        });

        // When: Handler is called
        await resetPasswordHandler(token, newPassword, mockResponse as Response);

        // Then: Error response is sent
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid or expired reset token',
          error: 'Invalid or expired reset token',
        });
      });
    });

    describe('validateResetTokenHandler', () => {
      it('should validate token successfully', async () => {
        // Given: Valid token
        const token = 'valid-token';
        const mockToken = {
          id: 'token-id',
          userId: 'test-user-id',
          type: 'PASSWORD_RESET',
          token,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          usedAt: null,
          createdAt: new Date(),
        };
        const mockUser = {
          id: 'test-user-id',
          email: 'test@example.com',
          status: 'ACTIVE',
        };

        mockedEmailRepository.getTokenInfo.mockResolvedValue(mockToken as any);
        mockedUserRepository.findById.mockResolvedValue(mockUser as any);

        // When: Handler is called
        await validateResetTokenHandler(token, mockResponse as Response);

        // Then: Token is validated
        expect(mockedEmailRepository.getTokenInfo).toHaveBeenCalledWith(token);
        expect(mockedUserRepository.findById).toHaveBeenCalledWith(mockToken.userId);
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          message: 'Token is valid',
          data: {
            email: mockUser.email,
          },
        });
      });

      it('should handle invalid token', async () => {
        // Given: Invalid token
        const token = 'invalid-token';
        mockedEmailRepository.getTokenInfo.mockResolvedValue(null);

        // When: Handler is called
        await validateResetTokenHandler(token, mockResponse as Response);

        // Then: Error response is sent
        expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid or expired token',
          error: 'Invalid or expired token',
        });
      });
    });
  });
});
