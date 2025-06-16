import request from 'supertest';
import app from '../../src/index';
import { generateTestCredentials } from '../helpers/test-helpers';
import { TestImageGenerator } from '../helpers/image-generator';
import { IMAGE_FORMATS } from '../../src/config/constants';

describe('Profile Image Management', () => {
  // Helper function to create an authenticated user for each test
  const createAuthenticatedUser = async () => {
    const testUser = generateTestCredentials();
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);
    
    return {
      token: loginResponse.body.data.token,
      userId: loginResponse.body.data.user.id,
      user: loginResponse.body.data.user
    };
  };

  describe('Authentication and Basic Routes', () => {
    it('should reject profile image upload without authentication', async () => {
      await request(app)
        .post('/api/users/me/profile-image')
        .expect(401);
    });

    it('should reject profile image delete without authentication', async () => {
      await request(app)
        .delete('/api/users/me/profile-image')
        .expect(401);
    });

    it('should reject profile image upload without file', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'No file provided',
        error: 'Profile image file is required'
      });
    });
  });

  describe('File Upload Tests', () => {
    it('should reject invalid file types', async () => {
      const { token } = await createAuthenticatedUser();
      const textBuffer = TestImageGenerator.createInvalidImageBuffer();

      const response = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid file type'
      });
    });

    it('should upload a valid image successfully', async () => {
      const { token, userId } = await createAuthenticatedUser();
      const imageBuffer = TestImageGenerator.createValidJpegBuffer();

      const response = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'test.webp')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          user: {
            id: userId,
            profileImageUrl: expect.stringMatching(
              new RegExp(`^\/uploads\/profile-images\/[^\/]+\\.(${Object.values(IMAGE_FORMATS).join('|')})$`)
            )
          }
        }
      });

      // Store the image URL for reference
      const imageUrl = response.body.data.user.profileImageUrl;
      expect(imageUrl).toBeTruthy();
    });

    it('should get user profile with image URL', async () => {
      const { token } = await createAuthenticatedUser();
      
      // First upload an image
      const imageBuffer = TestImageGenerator.createValidJpegBuffer();
      await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'test.webp')
        .expect(200);

      // Then get the profile
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.user.profileImageUrl).toBeTruthy();
      expect(response.body.data.user.profileImageUrl).toMatch(
        new RegExp(`^\/uploads\/profile-images\/[^\/]+\\.(${Object.values(IMAGE_FORMATS).join('|')})$`)
      );
    });

    it('should replace existing profile image', async () => {
      const { token } = await createAuthenticatedUser();
      const imageBuffer = TestImageGenerator.createValidJpegBuffer();

      // Upload first image
      const firstResponse = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'first-test.webp')
        .expect(200);

      const oldImageUrl = firstResponse.body.data.user.profileImageUrl;

      // Upload new image
      const response = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'new-test.webp')
        .expect(200);

      const newImageUrl = response.body.data.user.profileImageUrl;

      // URLs should be different
      expect(newImageUrl).not.toBe(oldImageUrl);
      expect(newImageUrl).toMatch(
        new RegExp(`^\/uploads\/profile-images\/[^\/]+\\.(${Object.values(IMAGE_FORMATS).join('|')})$`)
      );
    });
  });

  describe('Profile Image Deletion', () => {
    it('should delete profile image successfully', async () => {
      const { token, userId } = await createAuthenticatedUser();
      
      // First upload an image
      const imageBuffer = TestImageGenerator.createValidJpegBuffer();
      await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'setup.webp')
        .expect(200);

      // Then delete it
      const response = await request(app)
        .delete('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Profile image deleted successfully',
        data: {
          user: {
            id: userId,
            profileImageUrl: null
          }
        }
      });
    });

    it('should return error when trying to delete non-existent image', async () => {
      const { token } = await createAuthenticatedUser();

      // Try to delete when no image exists
      const response = await request(app)
        .delete('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User has no profile image',
        error: 'User has no profile image'
      });
    });
  });

  describe('Static File Serving', () => {
    it('should serve uploaded images as static files', async () => {
      const { token } = await createAuthenticatedUser();
      const imageBuffer = TestImageGenerator.createValidJpegBuffer();

      // Upload image
      const uploadResponse = await request(app)
        .post('/api/users/me/profile-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', imageBuffer, 'serve-test.webp')
        .expect(200);

      const imageUrl = uploadResponse.body.data.user.profileImageUrl;

      // Access the image directly
      const imageResponse = await request(app)
        .get(imageUrl)
        .expect(200);

      expect(imageResponse.headers['content-type']).toMatch(/^image\//);
      expect(imageResponse.body).toBeTruthy();
    });
  });
});
