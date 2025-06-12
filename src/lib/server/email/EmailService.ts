import { Resend } from 'resend';

export type EmailTemplate = {
  subject: string;
  html: string;
};

type EmailTemplateOptions =
  | { type: 'welcome'; name?: string }
  | { type: 'normal-email-verification'; url: string; name: string }
  | { type: 'email-forget-password'; url: string; name: string }
  /** OTP Plugin Types **/
  | { type: 'email-verification'; otp: string }
  | { type: 'forget-password'; otp: string }
  | { type: 'sign-in'; otp: string };

export type SendEmailOptions =
  | {
      to: string | string[];
      from?: string;
      subject: string;
      html: string;
      template?: undefined;
    }
  | {
      to: string | string[];
      from?: string;
      template: EmailTemplateOptions;
    };

export type OTPEmailOptions = {
  to: string;
  otp: string;
  type: Extract<
    EmailTypes,
    'email-verification' | 'forget-password' | 'sign-in'
  >;
};

type EmailTypes =
  | 'welcome'
  | 'email-verification'
  | 'forget-password'
  | 'sign-in';

export class EmailService {
  private resend: Resend;
  private readonly defaultFrom: string;
  private readonly isDisabled: boolean;

  constructor(apiKey: string, defaultFrom: string, isDisabled = false) {
    this.resend = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
    this.isDisabled = isDisabled;
    if (isDisabled) console.log('📧 Email sending disabled');
  }

  getEmailTemplate(options: EmailTemplateOptions): EmailTemplate {
    switch (options.type) {
      case 'welcome': {
        const welcome =
          options.name === '' ? 'Welcome!' : `Welcome ${options.name}!`;
        // TypeScript knows options.name is available here
        return {
          subject: 'Welcome to our platform!',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${welcome}</h2>
            <p>Thank you for joining our platform. We're excited to have you on board!</p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The Team</p>
          </div>
        `,
        };
      }

      case 'normal-email-verification':
        // TypeScript knows options.url is available here
        return {
          subject: 'Verify your email address',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="${options.url}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
            <p>Or copy and paste this URL into your browser: ${options.url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this verification, please contact us.</p>
          </div>
        `,
        };

      case 'email-forget-password':
        // TypeScript knows options.url is available here
        return {
          subject: 'Verify your email address',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Please click the link below to reset your password:</p>
            <p><a href="${options.url}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
            <p>Or copy and paste this URL into your browser: ${options.url}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please contact us.</p>
          </div>
        `,
        };

      case 'email-verification':
        // TypeScript knows options.url is available here
        return {
          subject: 'Verify your email address',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Please use the following code to verify your email address:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
              ${options.otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please contact us.</p>
          </div>
        `,
        };

      case 'forget-password':
        // TypeScript knows options.otp is available here
        return {
          subject: 'Reset your password',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>Please use the following code to reset your password:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
              ${options.otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please contact us.</p>
          </div>
        `,
        };

      case 'sign-in':
        // TypeScript knows options.otp is available here
        return {
          subject: 'Sign in to your account',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sign In Verification</h2>
            <p>Please use the following code to sign in to your account:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
              ${options.otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this sign-in, please contact us.</p>
          </div>
        `,
        };

      default: {
        // This ensures exhaustive checking
        const _exhaustive: never = options;
        throw new Error(
          `Unknown email template type: ${JSON.stringify(options)}`
        );
      }
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const to: string | string[] = options.to;
    let subject: string;
    let html: string;

    if (options.template) {
      // Use the template system
      const emailTemplate = this.getEmailTemplate(options.template);
      subject = emailTemplate.subject;
      html = emailTemplate.html;
    } else {
      // Use custom subject and html
      subject = options.subject;
      html = options.html;
    }

    if (this.isDisabled) {
      console.log('📧 Email sending disabled - would have sent email to:', to);
      console.log('📧 Subject:', subject);
      console.log('📧 From:', options.from || this.defaultFrom);
      console.log('📧 HTML content:', html);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error.message}`);
      }

      console.log('Email sent successfully:', data?.id);
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Send OTP email for better-auth integration
   */
  async sendOTPEmail({ to, otp, type }: OTPEmailOptions): Promise<void> {
    await this.sendEmail({
      to,
      template: { type, otp },
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName?: string): Promise<void> {
    await this.sendEmail({
      to,
      template: { type: 'welcome', name: userName },
    });
  }
}

// Factory function to create email service instance
export function createEmailService(
  apiKey: string,
  defaultFrom: string,
  isDisabled = false
): EmailService {
  return new EmailService(apiKey, defaultFrom, isDisabled);
}
