import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, emailOTP, organization } from 'better-auth/plugins';
import type { DrizzleClient } from '../db';
import * as schema from '../db/schema';
import type { EmailService } from '../email';

export function createAuth(
  db: DrizzleClient,
  emailService: EmailService,
  origin: string
) {
  console.log('base path', origin);
  return betterAuth({
    database: drizzleAdapter(db, {
      schema,
      provider: 'sqlite',
      usePlural: true,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async user => {
            await emailService.sendWelcomeEmail(user.email, user.name);
          },
        },
      },
    },
    emailVerification: {
      async sendVerificationEmail({ user, token, url }) {
        console.log(`TODO:send verification email to ${user.email}`, url);
        try {
          await emailService.sendOTPEmail({
            to: user.email,
            otp: token,
            type: 'forget-password',
          });
          console.log(`Verification email sent successfully to ${user.email}`);
        } catch (error) {
          console.error(
            `Failed to send verification email to ${user.email}:`,
            error
          );
          throw error;
        }
      },
    },
    emailAndPassword: {
      enabled: true,
      async sendResetPassword({ user, token, url }) {
        console.log(
          `TODO:send password reset to ${user.email} for password reset`,
          url
        );
        try {
          await emailService.sendEmail({
            to: user.email,
            template: {
              type: 'forget-password',
              otp: token,
            },
          });
          console.log(
            `Reset token sent successfully to ${user.email} for password reset`
          );
        } catch (error) {
          console.error(`Failed to send reset token to ${user.email}:`, error);
          throw error;
        }
      },
    },
    plugins: [
      admin(),
      emailOTP({
        async sendVerificationOTP({ otp, email, type }) {
          console.log(`TODO:send otp to ${email} for ${type} with OTP: ${otp}`);
          try {
            await emailService.sendEmail({
              to: email,
              template: { type, otp },
            });
            console.log(`OTP sent successfully to ${email} for ${type}`);
          } catch (error) {
            console.error(`Failed to send OTP to ${email}:`, error);
            throw error;
          }
        },
      }),
      organization({
        async sendInvitationEmail(data) {
          const inviteUrl = `${origin}/accept-invitation?id=${data.id}`;
          await emailService.sendEmail({
            to: data.email,
            template: {
              type: 'organization-invite',
              inviterName: data.inviter.user.name,
              organizationName: data.organization.name,
              inviteUrl,
              role: data.role,
            },
          });
        },
      }),
    ],
  });
}
