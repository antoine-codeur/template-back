import { Request } from 'express';
import { USER_ROLES, USER_STATUS } from '@/config/constants';

// User types
export type UserRole = keyof typeof USER_ROLES;
export type UserStatus = keyof typeof USER_STATUS;

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string | null;
  bio?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  users: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Query types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserQuery extends PaginationQuery {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}
