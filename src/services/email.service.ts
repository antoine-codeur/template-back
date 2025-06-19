import nodemailer from 'nodemailer';
import { env } from '@/config/environment';
import { EMAIL_CONFIG, EMAIL_PROVIDERS, EMAIL_TYPES } from '@/config/constants';
import { EmailData, EmailConfig } from '@/models/email.model';
import { logger } from '@/config/logger';
import { TemplateLoader } from '@/utils/template-loader';
import { EmailRepository } from '@/repositories/email.repository';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static config: EmailConfig;

  /**
   * Initialize email service with configuration
   */
  static async initialize(): Promise<void> {
    this.config = this.buildConfig();
    
    switch (this.config.provider) {
      case 'SMTP':
        this.transporter = await this.createSMTPTransporter();
        break;
      case 'SENDGRID':
        this.transporter = await this.createSendGridTransporter();
        break;
      case 'AWS_SES':
        this.transporter = await this.createAWSSESTransporter();
        break;
      case 'CONSOLE':
        this.transporter = await this.createConsoleTransporter();
        break;
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }

    // Preload templates
    await TemplateLoader.preloadTemplates();

    logger.info(`Email service initialized with provider: ${this.config.provider}`);
  }

  /**
   * Send email
   */
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const { to, subject, type, templateData = {}, userId } = emailData;

      // Get email content from template
      const content = await this.getEmailContent(type, templateData);

      const mailOptions = {
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: content.html,
        text: content.text,
      };

      const result = await this.transporter.sendMail(mailOptions);

      // Log email attempt
      await EmailRepository.logEmail({
        userId,
        emailType: type,
        to: Array.isArray(to) ? to[0] || '' : to,
        from: this.config.from.email || '',
        subject,
        status: 'SENT',
        provider: this.config.provider,
        metadata: JSON.stringify({ messageId: result.messageId }),
      });

      logger.info(`Email sent successfully`, { 
        type, 
        to: Array.isArray(to) ? to : [to], 
        messageId: result.messageId 
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, emailData });

      // Log failed email attempt
      await EmailRepository.logEmail({
        userId: emailData.userId,
        emailType: emailData.type,
        to: Array.isArray(emailData.to) ? emailData.to[0] || '' : emailData.to,
        from: this.config.from.email || '',
        subject: emailData.subject || '',
        status: 'FAILED',
        provider: this.config.provider,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(data: {
    to: string;
    name: string;
    verificationUrl: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: `Verify your ${env.APP_NAME} account`,
      type: 'EMAIL_VERIFICATION',
      templateData: {
        appName: env.APP_NAME,
        name: data.name,
        verificationUrl: data.verificationUrl,
      },
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(data: {
    to: string;
    name: string;
    resetUrl: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: `Reset your ${env.APP_NAME} password`,
      type: 'PASSWORD_RESET',
      templateData: {
        appName: env.APP_NAME,
        name: data.name,
        resetUrl: data.resetUrl,
      },
    });
  }

  /**
   * Send password changed confirmation email
   */
  static async sendPasswordChangedEmail(data: {
    to: string;
    name: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: `${env.APP_NAME} password changed`,
      type: 'PASSWORD_CHANGED',
      templateData: {
        appName: env.APP_NAME,
        name: data.name,
        timestamp: new Date().toLocaleString(),
      },
    });
  }

  /**
   * Send account suspended email
   */
  static async sendAccountSuspendedEmail(data: {
    to: string;
    name: string;
    reason?: string;
    suspendedBy?: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: `${env.APP_NAME} account suspended`,
      type: 'ACCOUNT_SUSPENDED',
      templateData: {
        appName: env.APP_NAME,
        name: data.name,
        reason: data.reason,
        suspensionDate: new Date().toLocaleString(),
        suspendedBy: data.suspendedBy,
      },
    });
  }

  /**
   * Send account activated email
   */
  static async sendAccountActivatedEmail(data: {
    to: string;
    name: string;
    reason?: string;
    activatedBy?: string;
  }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: `${env.APP_NAME} account activated`,
      type: 'ACCOUNT_ACTIVATED',
      templateData: {
        appName: env.APP_NAME,
        name: data.name,
        reason: data.reason,
        activationDate: new Date().toLocaleString(),
        activatedBy: data.activatedBy,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });
  }

  /**
   * Get email content from templates
   */
  private static async getEmailContent(
    type: keyof typeof EMAIL_TYPES, 
    data: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    try {
      // Map email types to template names
      const templateMap: Record<keyof typeof EMAIL_TYPES, string> = {
        WELCOME: 'welcome',
        EMAIL_VERIFICATION: 'verification',
        PASSWORD_RESET: 'password-reset',
        PASSWORD_CHANGED: 'password-changed',
        ACCOUNT_SUSPENDED: 'account-suspended',
        ACCOUNT_ACTIVATED: 'account-activated',
      };

      const templateName = templateMap[type];
      if (!templateName) {
        throw new Error(`Unknown email type: ${type}`);
      }

      // Load both HTML and text templates
      const [html, text] = await Promise.all([
        TemplateLoader.loadTemplate(templateName, 'html', data),
        TemplateLoader.loadTemplate(templateName, 'txt', data),
      ]);

      return { html, text };
    } catch (error) {
      logger.error(`Failed to get email content for type: ${type}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback to basic templates
      return this.getFallbackContent(type, data);
    }
  }

  /**
   * Fallback content if template loading fails
   */
  private static getFallbackContent(
    type: keyof typeof EMAIL_TYPES, 
    data: Record<string, any>
  ): { html: string; text: string } {
    const fallbacks = {
      WELCOME: {
        html: `<h1>Welcome to ${data.appName || 'our platform'}!</h1><p>Hello ${data.name || 'there'},</p><p>Welcome to our platform!</p>`,
        text: `Welcome to ${data.appName || 'our platform'}!\n\nHello ${data.name || 'there'},\n\nWelcome to our platform!`,
      },
      EMAIL_VERIFICATION: {
        html: `<h1>Verify your email</h1><p>Hello ${data.name || 'there'},</p><p>Please verify your email: <a href="${data.verificationUrl || '#'}">Click here</a></p>`,
        text: `Verify your email\n\nHello ${data.name || 'there'},\n\nPlease verify your email: ${data.verificationUrl || 'No URL provided'}`,
      },
      PASSWORD_RESET: {
        html: `<h1>Reset your password</h1><p>Hello ${data.name || 'there'},</p><p>Reset your password: <a href="${data.resetUrl || '#'}">Click here</a></p>`,
        text: `Reset your password\n\nHello ${data.name || 'there'},\n\nReset your password: ${data.resetUrl || 'No URL provided'}`,
      },
      PASSWORD_CHANGED: {
        html: `<h1>Password changed</h1><p>Hello ${data.name || 'there'},</p><p>Your password has been changed successfully.</p>`,
        text: `Password changed\n\nHello ${data.name || 'there'},\n\nYour password has been changed successfully.`,
      },
      ACCOUNT_SUSPENDED: {
        html: `<h1>Account suspended</h1><p>Hello ${data.name || 'there'},</p><p>Your account has been suspended.</p>`,
        text: `Account suspended\n\nHello ${data.name || 'there'},\n\nYour account has been suspended.`,
      },
      ACCOUNT_ACTIVATED: {
        html: `<h1>Account activated</h1><p>Hello ${data.name || 'there'},</p><p>Your account has been activated.</p>`,
        text: `Account activated\n\nHello ${data.name || 'there'},\n\nYour account has been activated.`,
      },
    };

    return fallbacks[type] || { html: '', text: '' };
  }

  /**
   * Build email configuration from environment
   */
  private static buildConfig(): EmailConfig {
    return {
      provider: env.EMAIL_PROVIDER as keyof typeof EMAIL_PROVIDERS,
      from: {
        email: env.EMAIL_FROM_ADDRESS,
        name: env.EMAIL_FROM_NAME || env.APP_NAME,
      },
      smtp: env.EMAIL_PROVIDER === 'SMTP' ? {
        host: env.SMTP_HOST!,
        port: env.SMTP_PORT!,
        secure: env.SMTP_SECURE || false,
        auth: {
          user: env.SMTP_USER!,
          pass: env.SMTP_PASS!,
        },
      } : undefined,
      sendgrid: env.EMAIL_PROVIDER === 'SENDGRID' ? {
        apiKey: env.SENDGRID_API_KEY!,
      } : undefined,
      awsSes: env.EMAIL_PROVIDER === 'AWS_SES' ? {
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      } : undefined,
    };
  }

  /**
   * Create SMTP transporter
   */
  private static async createSMTPTransporter(): Promise<nodemailer.Transporter> {
    const transporter = nodemailer.createTransport({
      host: this.config.smtp!.host,
      port: this.config.smtp!.port,
      secure: this.config.smtp!.secure,
      auth: this.config.smtp!.auth,
    });

    // Verify connection
    await transporter.verify();
    return transporter;
  }

  /**
   * Create SendGrid transporter
   */
  private static async createSendGridTransporter(): Promise<nodemailer.Transporter> {
    // This would require @sendgrid/mail package
    throw new Error('SendGrid implementation pending');
  }

  /**
   * Create AWS SES transporter
   */
  private static async createAWSSESTransporter(): Promise<nodemailer.Transporter> {
    // This would require aws-sdk package
    throw new Error('AWS SES implementation pending');
  }

  /**
   * Create console transporter (for development)
   */
  private static async createConsoleTransporter(): Promise<nodemailer.Transporter> {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }
}

export const emailService = new EmailService();
