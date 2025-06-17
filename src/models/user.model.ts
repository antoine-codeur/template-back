import { z } from 'zod';
import { 
  emailSchema, 
  passwordSchema, 
  nameSchema, 
  bioSchema, 
  uuidSchema,
  profileImageUrlSchema
} from '@/utils/validators';

// User model schema
export const UserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  password: z.string(),
  name: nameSchema.nullable(),
  bio: bioSchema.nullable(),
  profileImageUrl: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLogin: z.date().nullable(),
});

// Safe user schema (without password)
export const SafeUserSchema = UserSchema.omit({ password: true });

// Create user schema
export const CreateUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema.optional(),
  bio: bioSchema.optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).default('USER'),
});

// Update user schema
export const UpdateUserSchema = z.object({
  name: nameSchema.optional(),
  bio: bioSchema.optional(),
  profileImageUrl: z.string().nullable().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// Update profile schema (for regular users)
export const UpdateProfileSchema = z.object({
  name: nameSchema.optional(),
  bio: bioSchema.optional(),
});

// User query schema
export const UserQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

// Additional type exports
export type UserRole = User['role'];
export type UserStatus = User['status'];
