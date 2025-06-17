import { prisma } from '@/config/database';
import { EmailToken } from '@prisma/client';
import { EMAIL_TOKEN_TYPES } from '@/models/email.model';
import { EMAIL_CONFIG } from '@/config/constants';
import { logger } from '@/config/logger';
import crypto from 'crypto';

export class EmailRepository {
  /**
   * Create email verification token
   */
  static async createVerificationToken(userId: string): Promise<string> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + EMAIL_CONFIG.VERIFICATION_TOKEN_EXPIRY);

      // Delete any existing verification tokens for this user
      await prisma.emailToken.deleteMany({
        where: {
          userId,
          type: EMAIL_TOKEN_TYPES.VERIFICATION,
        },
      });

      // Create new token
      await prisma.emailToken.create({
        data: {
          userId,
          type: EMAIL_TOKEN_TYPES.VERIFICATION,
          token,
          expiresAt,
        },
      });

      logger.info('Email verification token created', { userId, expiresAt });
      return token;
    } catch (error) {
      logger.error('Failed to create email verification token', { error, userId });
      throw new Error('Failed to create email verification token');
    }
  }

  /**
   * Create password reset token
   */
  static async createPasswordResetToken(userId: string): Promise<string> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + EMAIL_CONFIG.PASSWORD_RESET_TOKEN_EXPIRY);

      // Delete any existing password reset tokens for this user
      await prisma.emailToken.deleteMany({
        where: {
          userId,
          type: EMAIL_TOKEN_TYPES.PASSWORD_RESET,
        },
      });

      // Create new token
      await prisma.emailToken.create({
        data: {
          userId,
          type: EMAIL_TOKEN_TYPES.PASSWORD_RESET,
          token,
          expiresAt,
        },
      });

      logger.info('Password reset token created', { userId, expiresAt });
      return token;
    } catch (error) {
      logger.error('Failed to create password reset token', { error, userId });
      throw new Error('Failed to create password reset token');
    }
  }

  /**
   * Verify and consume email token
   */
  static async verifyAndConsumeToken(
    token: string, 
    type: keyof typeof EMAIL_TOKEN_TYPES
  ): Promise<{ userId: string; isValid: boolean }> {
    try {
      const emailToken = await prisma.emailToken.findFirst({
        where: {
          token,
          type,
          usedAt: null, // Not used yet
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
      });

      if (!emailToken) {
        logger.warn('Invalid or expired email token', { token: token.substring(0, 8) + '...', type });
        return { userId: '', isValid: false };
      }

      // Mark token as used
      await prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      });

      logger.info('Email token verified and consumed', { 
        userId: emailToken.userId, 
        type,
        tokenId: emailToken.id 
      });

      return { userId: emailToken.userId, isValid: true };
    } catch (error) {
      logger.error('Failed to verify email token', { error, token: token.substring(0, 8) + '...', type });
      return { userId: '', isValid: false };
    }
  }

  /**
   * Check if user can request new verification email (cooldown check)
   */
  static async canRequestVerification(userId: string): Promise<boolean> {
    try {
      const recentToken = await prisma.emailToken.findFirst({
        where: {
          userId,
          type: EMAIL_TOKEN_TYPES.VERIFICATION,
          createdAt: {
            gt: new Date(Date.now() - EMAIL_CONFIG.RESEND_VERIFICATION_COOLDOWN),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return !recentToken;
    } catch (error) {
      logger.error('Failed to check verification cooldown', { error, userId });
      return false;
    }
  }

  /**
   * Get token info without consuming it
   */
  static async getTokenInfo(token: string): Promise<EmailToken | null> {
    try {
      return await prisma.emailToken.findFirst({
        where: {
          token,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get token info', { error, token: token.substring(0, 8) + '...' });
      return null;
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.emailToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Cleaned up expired email tokens', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', { error });
      return 0;
    }
  }

  /**
   * Log email to database
   */
  static async logEmail(data: {
    userId?: string;
    emailType: string;
    to: string;
    from: string;
    subject: string;
    status: string;
    provider: string;
    errorMessage?: string;
    metadata?: string;
    sentAt?: Date;
  }): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          userId: data.userId,
          emailType: data.emailType,
          to: data.to,
          from: data.from,
          subject: data.subject,
          status: data.status,
          provider: data.provider,
          errorMessage: data.errorMessage,
          metadata: data.metadata,
          sentAt: data.sentAt || (data.status === 'SENT' ? new Date() : null),
        },
      });
    } catch (error) {
      logger.error('Failed to log email', { error, data });
    }
  }

  /**
   * Get email logs for a user
   */
  static async getUserEmailLogs(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      return await prisma.emailLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          emailType: true,
          to: true,
          subject: true,
          status: true,
          provider: true,
          sentAt: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error('Failed to get user email logs', { error, userId });
      return [];
    }
  }

  /**
   * Get email statistics
   */
  static async getEmailStats(userId?: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }> {
    try {
      const where = userId ? { userId } : {};

      const [total, sent, failed, pending] = await Promise.all([
        prisma.emailLog.count({ where }),
        prisma.emailLog.count({ where: { ...where, status: 'SENT' } }),
        prisma.emailLog.count({ where: { ...where, status: 'FAILED' } }),
        prisma.emailLog.count({ where: { ...where, status: 'PENDING' } }),
      ]);

      return { total, sent, failed, pending };
    } catch (error) {
      logger.error('Failed to get email stats', { error, userId });
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }

  /**
   * Generic method to generate tokens (used by tests)
   */
  static async generateToken(userId: string, type: string): Promise<string> {
    if (type === 'EMAIL_VERIFICATION' || type === EMAIL_TOKEN_TYPES.VERIFICATION) {
      return this.createVerificationToken(userId);
    } else if (type === 'PASSWORD_RESET' || type === EMAIL_TOKEN_TYPES.PASSWORD_RESET) {
      return this.createPasswordResetToken(userId);
    } else {
      throw new Error(`Unsupported token type: ${type}`);
    }
  }

  /**
   * Check if user has recent tokens of specified type
   */
  static async hasRecentToken(userId: string, type: string): Promise<boolean> {
    try {
      const tokenType = type === 'EMAIL_VERIFICATION' ? EMAIL_TOKEN_TYPES.VERIFICATION : 
                       type === 'PASSWORD_RESET' ? EMAIL_TOKEN_TYPES.PASSWORD_RESET : type;
      
      const cutoffTime = new Date(Date.now() - EMAIL_CONFIG.RESEND_VERIFICATION_COOLDOWN);
      
      const recentToken = await prisma.emailToken.findFirst({
        where: {
          userId,
          type: tokenType,
          createdAt: {
            gt: cutoffTime,
          },
        },
      });

      return !!recentToken;
    } catch (error) {
      logger.error('Failed to check recent tokens', { error, userId, type });
      return false;
    }
  }

  /**
   * Get email logs for a user
   */
  static async getEmailLogs(userId: string): Promise<any[]> {
    try {
      return await prisma.emailLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get email logs', { error, userId });
      return [];
    }
  }

  /**
   * Expire a token (for testing)
   */
  static async expireToken(token: string): Promise<void> {
    try {
      await prisma.emailToken.updateMany({
        where: { token },
        data: { expiresAt: new Date(Date.now() - 1000) }, // Set to past
      });
    } catch (error) {
      logger.error('Failed to expire token', { error, token });
    }
  }
}
