import request from 'supertest';
import app from '@/index';

describe('Test Configuration', () => {
  it('should be able to make a request to the app', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app)
      .get('/api/unknown-endpoint')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  });
});
