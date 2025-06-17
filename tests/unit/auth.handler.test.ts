import { Request, Response } from 'express';
import { 
  registerHandler, 
  loginHandler, 
  getProfileHandler, 
  updateProfileHandler,
  changePasswordHandler 
} from '@/handlers/auth/auth.handler';
import { authService } from '@/services/auth.service';
import { HTTP_STATUS } from '@/config/constants';

// Mock the auth service
jest.mock('@/services/auth.service');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Mock logger
jest.mock('@/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Auth Handlers Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  describe('registerHandler', () => {
    it('should handle successful registration', async () => {
      // Given: Valid registration request
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };
      
      const serviceResponse = {
        user: {
          id: 'user-id',
          email: credentials.email,
          name: credentials.name,
          bio: null,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          profileImageUrl: null,
          emailVerified: false,
          emailVerifiedAt: null,
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
        },
        token: 'jwt-token',
      };

      mockRequest.body = credentials;
      mockedAuthService.register.mockResolvedValue(serviceResponse);

      // When: Handler processes registration
      await registerHandler(credentials, mockResponse as Response);

      // Then: Successful response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: serviceResponse,
        message: 'User registered successfully',
      });
      expect(mockedAuthService.register).toHaveBeenCalledWith(credentials);
    });

    it('should handle registration errors', async () => {
      // Given: Registration request that will fail
      const credentials = { email: 'test@example.com', password: 'weak', name: 'Test' };
      const error = new Error('Email is already registered');
      
      mockRequest.body = credentials;
      mockedAuthService.register.mockRejectedValue(error);

      // When: Handler processes registration
      await registerHandler(credentials, mockResponse as Response);

      // Then: Error response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Email is already registered',
        error: 'Email is already registered',
      });
    });
  });

  describe('loginHandler', () => {
    it('should handle successful login', async () => {
      // Given: Valid login request
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };
      
      const serviceResponse = {
        user: {
          id: 'user-id',
          email: credentials.email,
          name: 'Test User',
          bio: null,
          role: 'USER' as const,
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          profileImageUrl: null,
          emailVerified: false,
          emailVerifiedAt: null,
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
        },
        token: 'jwt-token',
      };

      mockRequest.body = credentials;
      mockedAuthService.login.mockResolvedValue(serviceResponse);

      // When: Handler processes login
      await loginHandler(credentials, mockResponse as Response);

      // Then: Successful response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: serviceResponse,
        message: 'Login successful',
      });
      expect(mockedAuthService.login).toHaveBeenCalledWith(credentials);
    });

    it('should handle login errors', async () => {
      // Given: Login request that will fail
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      
      mockRequest.body = credentials;
      mockedAuthService.login.mockRejectedValue(error);

      // When: Handler processes login
      await loginHandler(credentials, mockResponse as Response);

      // Then: Error response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: 'Invalid credentials',
      });
    });
  });

  describe('getProfileHandler', () => {
    it('should handle successful profile retrieval', async () => {
      // Given: Valid user ID
      const userId = 'user-id';
      const userProfile = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        bio: null,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        profileImageUrl: null,
        emailVerified: false,
        emailVerifiedAt: null,
        suspensionReason: null,
        suspendedAt: null,
        suspendedBy: null,
      };

      mockedAuthService.getProfile.mockResolvedValue(userProfile);

      // When: Handler gets profile
      await getProfileHandler(userId, mockResponse as Response);

      // Then: Successful response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: userProfile },
      });
      expect(mockedAuthService.getProfile).toHaveBeenCalledWith(userId);
    });

    it('should handle profile retrieval errors', async () => {
      // Given: Invalid user ID
      const userId = 'invalid-id';
      const error = new Error('User not found');
      
      mockedAuthService.getProfile.mockRejectedValue(error);

      // When: Handler tries to get profile
      await getProfileHandler(userId, mockResponse as Response);

      // Then: Error response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });
  });

  describe('updateProfileHandler', () => {
    it('should handle successful profile update', async () => {
      // Given: Valid update request
      const userId = 'user-id';
      const profileData = { name: 'Updated Name', bio: 'Updated bio' };
      const updatedProfile = {
        id: userId,
        email: 'test@example.com',
        name: profileData.name,
        bio: profileData.bio,
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        profileImageUrl: null,
        emailVerified: false,
        emailVerifiedAt: null,
        suspensionReason: null,
        suspendedAt: null,
        suspendedBy: null,
      };

      mockedAuthService.updateProfile.mockResolvedValue(updatedProfile);

      // When: Handler updates profile
      await updateProfileHandler(userId, profileData, mockResponse as Response);

      // Then: Successful response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { user: updatedProfile },
        message: 'Profile updated successfully',
      });
      expect(mockedAuthService.updateProfile).toHaveBeenCalledWith(userId, profileData);
    });

    it('should handle profile update errors', async () => {
      // Given: Invalid update request
      const userId = 'invalid-id';
      const profileData = { name: 'Test' };
      const error = new Error('User not found');
      
      mockedAuthService.updateProfile.mockRejectedValue(error);

      // When: Handler tries to update profile
      await updateProfileHandler(userId, profileData, mockResponse as Response);

      // Then: Error response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });
  });

  describe('changePasswordHandler', () => {
    it('should handle successful password change', async () => {
      // Given: Valid password change request
      const userId = 'user-id';
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      mockedAuthService.changePassword.mockResolvedValue(undefined);

      // When: Handler changes password
      await changePasswordHandler(userId, passwordData, mockResponse as Response);

      // Then: Successful response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
        data: {},
      });
      expect(mockedAuthService.changePassword).toHaveBeenCalledWith(
        userId,
        passwordData.currentPassword,
        passwordData.newPassword
      );
    });

    it('should handle password change errors', async () => {
      // Given: Invalid password change request
      const userId = 'user-id';
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      };
      const error = new Error('Invalid current password');
      
      mockedAuthService.changePassword.mockRejectedValue(error);

      // When: Handler tries to change password
      await changePasswordHandler(userId, passwordData, mockResponse as Response);

      // Then: Error response is sent
      expect(mockStatus).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid current password',
        error: 'Invalid current password',
      });
    });
  });
});
