import request from 'supertest';
import app from '@/index';

/**
 * API client for making authenticated requests
 */
export class ApiClient {
  private token?: string;
  private customHeaders: Record<string, string> = {};

  constructor(token?: string) {
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
    return this;
  }

  setHeader(key: string, value: string) {
    this.customHeaders[key] = value;
    return this;
  }

  removeHeader(key: string) {
    delete this.customHeaders[key];
    return this;
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
      ...this.customHeaders,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async get(path: string) {
    return request(app)
      .get(path)
      .set(this.getHeaders());
  }

  async post(path: string, data?: any) {
    return request(app)
      .post(path)
      .set(this.getHeaders())
      .send(data);
  }

  async put(path: string, data?: any) {
    return request(app)
      .put(path)
      .set(this.getHeaders())
      .send(data);
  }

  async patch(path: string, data?: any) {
    return request(app)
      .patch(path)
      .set(this.getHeaders())
      .send(data);
  }

  async delete(path: string) {
    return request(app)
      .delete(path)
      .set(this.getHeaders());
  }
}

/**
 * Create an unauthenticated API client
 */
export const createApiClient = () => new ApiClient();

/**
 * Create an authenticated API client
 */
export const createAuthenticatedApiClient = (token: string) => new ApiClient(token);
