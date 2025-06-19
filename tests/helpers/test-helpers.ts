import { generateToken } from '@/utils/helpers';
import { User } from '@/models/user.model';
import { UserRole, UserStatus } from '@/types';
import { JwtPayload } from '@/models/auth.model';
import { prisma } from '@/config/database';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}

export interface AuthenticatedTestUser extends TestUser {
  token: string;
}

/**
 * Create a test user in the database
 */
export const createTestUser = async (
  userData: Partial<TestUser> & { email: string; name: string }
): Promise<TestUser> => {
  const defaultUserData = {
    role: 'USER' as UserRole,
    status: 'ACTIVE' as UserStatus,
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
  };

  const user = await prisma.user.create({
    data: {
      ...defaultUserData,
      ...userData,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name || 'Default Name', // Handle nullable name
    role: user.role as UserRole,
    status: user.status as UserStatus,
  };
};

/**
 * Create an authenticated test user with JWT token
 */
export const createAuthenticatedTestUser = async (
  userData: Partial<TestUser> & { email: string; name: string }
): Promise<AuthenticatedTestUser> => {
  const user = await createTestUser(userData);
  
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const token = generateToken(tokenPayload);

  return {
    ...user,
    token,
  };
};

/**
 * Create an admin test user
 */
export const createAdminUser = async (
  userData: Partial<TestUser> = {}
): Promise<AuthenticatedTestUser> => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  return createAuthenticatedTestUser({
    email: `admin-${timestamp}-${randomId}@test.com`,
    name: 'Admin User',
    role: 'ADMIN',
    ...userData,
  });
};

/**
 * Create a regular test user
 */
export const createRegularUser = async (
  userData: Partial<TestUser> = {}
): Promise<AuthenticatedTestUser> => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  return createAuthenticatedTestUser({
    email: `user-${timestamp}-${randomId}@test.com`,
    name: 'Regular User',
    role: 'USER',
    ...userData,
  });
};

/**
 * Clean up all test users
 */
export const cleanupTestUsers = async (): Promise<void> => {
  // Delete email tokens first to avoid foreign key constraints
  await prisma.emailToken.deleteMany();
  await prisma.emailLog.deleteMany();
  // Then delete users
  await prisma.user.deleteMany();
};

/**
 * Generate test credentials for registration
 */
export const generateTestCredentials = (overrides: any = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  
  return {
    email: `test-${timestamp}-${randomId}@example.com`,
    password: 'SecurePassword123!',
    name: 'Test User',
    ...overrides,
  };
};

/**
 * Common test expectations for user objects
 */
export const expectUserShape = (user: any) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('status');
  expect(user).toHaveProperty('createdAt');
  expect(user).toHaveProperty('updatedAt');
  expect(user).not.toHaveProperty('password');
};

/**
 * Common test expectations for API responses
 */
export const expectApiResponse = (response: any, expectedStatus: number = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('message');
};

/**
 * Common test expectations for successful API responses with data
 */
export const expectSuccessResponse = (response: any, expectedStatus: number = 200) => {
  expectApiResponse(response, expectedStatus);
  expect(response.body.success).toBe(true);
  expect(response.body).toHaveProperty('data');
};

/**
 * Common test expectations for error API responses
 */
export const expectErrorResponse = (response: any, expectedStatus: number) => {
  expectApiResponse(response, expectedStatus);
  expect(response.body.success).toBe(false);
  expect(response.body).toHaveProperty('error');
};
