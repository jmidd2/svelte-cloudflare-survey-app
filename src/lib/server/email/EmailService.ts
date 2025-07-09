export type EmailTemplate = {
  subject: string;
  html: string;
};

export interface OrganizationInvitationOptions {
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
}

type EmailTemplateOptions =
  | { type: 'welcome'; name?: string }
  | { type: 'normal-email-verification'; url: string; name: string }
  | { type: 'email-forget-password'; url: string; name: string }
  | { type: 'email-verification'; token: string; name: string; url: string }
  /** OTP Plugin Types **/
  | { type: 'forget-password'; otp: string }
  | { type: 'sign-in'; otp: string }
  | ({ type: 'organization-invite' } & OrganizationInvitationOptions);

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

export type SendEmailVerificationOptions = {
  to: string;
  token: string;
  url: string;
  name: string;
};

export type OTPEmailOptions = {
  to: string;
  otp: string;
  type: Extract<EmailTypes, 'forget-password' | 'sign-in'>;
};

type EmailTypes =
  | 'welcome'
  | 'email-verification'
  | 'forget-password'
  | 'sign-in'
  | 'organization-invite';

export const RESEND_ERROR_CODES_BY_KEY = {
  missing_required_field: 422,
  invalid_idempotency_key: 400,
  invalid_idempotent_request: 409,
  concurrent_idempotent_requests: 409,
  invalid_access: 422,
  invalid_parameter: 422,
  invalid_region: 422,
  rate_limit_exceeded: 429,
  missing_api_key: 401,
  invalid_api_Key: 403,
  invalid_from_address: 403,
  validation_error: 403,
  not_found: 404,
  method_not_allowed: 405,
  application_error: 500,
  internal_server_error: 500,
} as const;

export type RESEND_ERROR_CODE_KEY = keyof typeof RESEND_ERROR_CODES_BY_KEY;
export interface ErrorResponse {
  message: string;
  name: RESEND_ERROR_CODE_KEY;
}
export interface CreateEmailResponseSuccess {
  /** The ID of the newly created email. */
  id: string;
}

export interface CreateEmailResponse {
  data: CreateEmailResponseSuccess | null;
  error: ErrorResponse | null;
}

export class EmailService {
  // private resend: Resend;
  private readonly defaultFrom: string;
  private readonly isDisabled: boolean;
  private readonly apiKey: string;

  constructor(apiKey: string, defaultFrom: string, isDisabled = false) {
    // this.resend = new Resend(apiKey);
    this.apiKey = apiKey;
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

      case 'email-verification':
        // TypeScript knows options.url is available here
        return {
          subject: 'Verify your email address',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>${options.name}, please click the link below to verify your email address:</p>
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
          subject: 'Reset your password',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>${options.name}, please click the link below to reset your password:</p>
            <p><a href="${options.url}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
            <p>Or copy and paste this URL into your browser: ${options.url}</p>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please contact us.</p>
          </div>
        `,
        };

      // case 'email-verification':
      //   // TypeScript knows options.url is available here
      //   return {
      //     subject: 'Verify your email address',
      //     html: `
      //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      //       <h2>Password Reset</h2>
      //       <p>Please click the link below to reset your password:</p>
      //       <p><a href="${options.url}" style="background-color: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
      //       <p>Or copy and paste this URL into your browser: ${options.url}</p>
      //       <p>This link will expire in 10 minutes.</p>
      //       <p>If you didn't request a password reset, please contact us.</p>
      //     </div>
      //   `,
      //   };

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

      case 'organization-invite': {
        const opts = options;
        return {
          subject: `You're invited to join ${opts.organizationName}`,
          html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">You're Invited!</h1>
          <p style="color: #666; font-size: 16px;">
            ${opts.inviterName} has invited you to join <strong>${opts.organizationName}</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Invitation Details</h3>
          <p><strong>Organization:</strong> ${opts.organizationName}</p>
          <p><strong>Role:</strong> ${opts.role}</p>
          <p><strong>Invited by:</strong> ${opts.inviterName}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${opts.inviteUrl}" 
             style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Accept Invitation
          </a>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link: ${opts.inviteUrl}
          </p>
          <p style="color: #999; font-size: 12px;">
            This invitation will expire in 7 days.
          </p>
        </div>
      </div>
    `,
        };
      }

      default: {
        // This ensures exhaustive checking
        const _exhaustive: never = options;
        throw new Error(
          `Unknown email template type: ${JSON.stringify(options)}`
        );
      }
    }
  }

  private async sendRequest({
    from,
    to,
    subject,
    html,
  }: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
  }): Promise<CreateEmailResponse> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        try {
          const rawError = await response.text();
          return { data: null, error: JSON.parse(rawError) };
        } catch (err) {
          if (err instanceof SyntaxError) {
            return {
              data: null,
              error: {
                name: 'application_error',
                message:
                  'Internal server error. We are unable to process your request right now, please try again later.',
              },
            };
          }

          const error: ErrorResponse = {
            message: response.statusText,
            name: 'application_error',
          };

          if (err instanceof Error) {
            return { data: null, error: { ...error, message: err.message } };
          }

          return { data: null, error };
        }
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Uncaught error when sending email:', error);
      return {
        data: null,
        error: {
          name: 'application_error',
          message: 'Unable to fetch data. The request could not be resolved.',
        },
      };
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
      // const { data, error } = await this.resend.emails.send({
      //   from: options.from || this.defaultFrom,
      //   to,
      //   subject,
      //   html,
      // });
      const { data, error } = await this.sendRequest({
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

  async sendVerificationEmail({
    to,
    token,
    url,
    name,
  }: SendEmailVerificationOptions): Promise<void> {
    await this.sendEmail({
      to,
      template: { type: 'email-verification', token, url, name },
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

const emailServiceCache = new Map<symbol, EmailService>();

// Factory function to create email service instance
export function createEmailService(
  apiKey: string,
  defaultFrom: string,
  isDisabled = false
): EmailService {
  const key = Symbol.for('email-service');

  if (emailServiceCache.has(key)) {
    return emailServiceCache.get(key)!;
  }

  const emailService = new EmailService(apiKey, defaultFrom, isDisabled);
  emailServiceCache.set(key, emailService);

  return emailService;
}
