import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/utils/validators';

// Login schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register schema
export const RegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
});

// Change password schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Update profile schema
export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Forgot password schema
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// JWT payload schema
export const JwtPayloadSchema = z.object({
  userId: z.string(),
  email: emailSchema,
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// Type exports
export type LoginCredentials = z.infer<typeof LoginSchema>;
export type RegisterCredentials = z.infer<typeof RegisterSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
