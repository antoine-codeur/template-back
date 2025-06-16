import { 
  createApiClient, 
  createAuthenticatedApiClient 
} from '../helpers/api-client';
import { 
  generateTestCredentials, 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectUserShape,
  createRegularUser,
  cleanupTestUsers 
} from '../helpers/test-helpers';

describe('User Story: Guest User Authentication', () => {
  const apiClient = createApiClient();

  afterEach(async () => {
    await cleanupTestUsers();
  });

  describe('As a guest user, I want to register a new account', () => {
    it('should successfully register with valid credentials', async () => {
      // Given: Valid registration credentials
      const credentials = generateTestCredentials();

      // When: Guest user registers
      const response = await apiClient.post('/api/auth/register', credentials);

      // Then: Registration is successful
      expectSuccessResponse(response, 201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      
      // And: User data is properly formatted
      expectUserShape(response.body.data.user);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.user.name).toBe(credentials.name);
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.status).toBe('ACTIVE');
    });

    it('should reject registration with duplicate email', async () => {
      // Given: An existing user
      const credentials = generateTestCredentials();
      await apiClient.post('/api/auth/register', credentials);

      // When: Another user tries to register with same email
      const response = await apiClient.post('/api/auth/register', credentials);

      // Then: Registration is rejected
      expectErrorResponse(response, 409);
      expect(response.body.error).toBe('Email is already registered');
    });

    it('should reject registration with invalid email format', async () => {
      // Given: Invalid email format
      const credentials = generateTestCredentials({ email: 'invalid-email' });

      // When: Guest user tries to register
      const response = await apiClient.post('/api/auth/register', credentials);

      // Then: Registration is rejected
      expectErrorResponse(response, 400);
    });

    it('should reject registration with weak password', async () => {
      // Given: Weak password
      const credentials = generateTestCredentials({ password: '123' });

      // When: Guest user tries to register
      const response = await apiClient.post('/api/auth/register', credentials);

      // Then: Registration is rejected
      expectErrorResponse(response, 400);
    });

    it('should reject registration with missing required fields', async () => {
      // Given: Missing required fields
      const incompleteCredentials = { email: 'test@test.com' };

      // When: Guest user tries to register
      const response = await apiClient.post('/api/auth/register', incompleteCredentials);

      // Then: Registration is rejected
      expectErrorResponse(response, 400);
    });
  });

  describe('As a guest user, I want to login with email and password', () => {
    it('should successfully login with valid credentials', async () => {
      // Given: An existing user
      const credentials = generateTestCredentials();
      await apiClient.post('/api/auth/register', credentials);

      // When: User logs in with valid credentials
      const loginResponse = await apiClient.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Then: Login is successful
      expectSuccessResponse(loginResponse, 200);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.data).toHaveProperty('user');
      expect(loginResponse.body.data).toHaveProperty('token');
      
      // And: User data is properly formatted
      expectUserShape(loginResponse.body.data.user);
      expect(loginResponse.body.data.user.email).toBe(credentials.email);
      
      // And: JWT token is provided
      expect(typeof loginResponse.body.data.token).toBe('string');
      expect(loginResponse.body.data.token.length).toBeGreaterThan(0);
    });

    it('should reject login with invalid password', async () => {
      // Given: An existing user
      const credentials = generateTestCredentials();
      await apiClient.post('/api/auth/register', credentials);

      // When: User tries to login with wrong password
      const response = await apiClient.post('/api/auth/login', {
        email: credentials.email,
        password: 'wrongpassword',
      });

      // Then: Login is rejected
      expectErrorResponse(response, 401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      // Given: Non-existent user email
      const credentials = {
        email: 'nonexistent@test.com',
        password: 'password123',
      };

      // When: User tries to login
      const response = await apiClient.post('/api/auth/login', credentials);

      // Then: Login is rejected
      expectErrorResponse(response, 401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with malformed email', async () => {
      // Given: Malformed email
      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      // When: User tries to login
      const response = await apiClient.post('/api/auth/login', credentials);

      // Then: Login is rejected
      expectErrorResponse(response, 400);
    });

    it('should update lastLogin timestamp on successful login', async () => {
      // Given: An existing user
      const credentials = generateTestCredentials();
      await apiClient.post('/api/auth/register', credentials);

      // When: User logs in
      const response = await apiClient.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Then: lastLogin is updated
      expectSuccessResponse(response, 200);
      expect(response.body.data.user.lastLogin).toBeTruthy();
      expect(new Date(response.body.data.user.lastLogin)).toBeInstanceOf(Date);
    });
  });
});
