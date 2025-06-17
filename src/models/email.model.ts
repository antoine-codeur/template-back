import { z } from 'zod';
import { EMAIL_TYPES, EMAIL_PROVIDERS } from '@/config/constants';

/**
 * Email verification token schema
 */
export const EmailVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
  token: z.string().min(1, 'Token is required'),
});

/**
 * Resend verification email schema
 */
export const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * Password reset confirmation schema
 */
export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Email token types
 */
export const EMAIL_TOKEN_TYPES = {
  VERIFICATION: 'VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

/**
 * Email status types
 */
export const EMAIL_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  BOUNCED: 'BOUNCED',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',
} as const;

/**
 * Email configuration interface
 */
export interface EmailConfig {
  provider: keyof typeof EMAIL_PROVIDERS;
  from: {
    email: string;
    name: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  awsSes?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

/**
 * Email data interface
 */
export interface EmailData {
  to: string | string[];
  subject: string;
  type: keyof typeof EMAIL_TYPES;
  templateData?: Record<string, any>;
  userId?: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

/**
 * Email template data interfaces
 */
export interface WelcomeEmailData {
  userName: string;
  appName: string;
  appUrl: string;
}

export interface VerificationEmailData {
  userName: string;
  appName: string;
  verificationUrl: string;
  expiresIn: string;
}

export interface PasswordResetEmailData {
  userName: string;
  appName: string;
  resetUrl: string;
  expiresIn: string;
}

export interface PasswordChangedEmailData {
  userName: string;
  appName: string;
  changeTime: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Email queue job data
 */
export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  attempts?: number;
  delay?: number;
}

/**
 * Type exports
 */
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type EmailTokenType = keyof typeof EMAIL_TOKEN_TYPES;
export type EmailStatusType = keyof typeof EMAIL_STATUS;
