import { SafeUser, User } from '@/types';

/**
 * Remove sensitive information from user object
 */
export const sanitizeUser = (user: User): SafeUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    bio: user.bio ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified ?? false,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin ?? null,
  };
};

/**
 * Format user data for API responses
 */
export const formatUser = (user: User): SafeUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    bio: user.bio ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified ?? false,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin ?? null,
  };
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (page: number, limit: number, total: number) => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    pages,
    hasNext,
    hasPrev,
  };
};

/**
 * Generate search query for database
 */
export const generateSearchQuery = (search: string) => {
  return `%${search.toLowerCase()}%`;
};

/**
 * Convert string to proper case
 */
export const toProperCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Clean and normalize email
 */
export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};
