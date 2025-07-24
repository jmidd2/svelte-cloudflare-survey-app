import { type Auth, type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, emailOTP, organization } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { DrizzleClient } from '../db';
import * as schema from '../db/schema';
import type { EmailService } from '../email';

const authClientCache = new Map<symbol, ReturnType<typeof createBetterAuth>>();

function createBetterAuth(
  db: DrizzleClient,
  emailService: EmailService,
  origin: string,
  platformEnv: App.Platform['env']
) {
  return betterAuth({
    socialProviders: {
      google: platformEnv
        ? {
            clientId: platformEnv.GOOGLE_CLIENT_ID,
            clientSecret: platformEnv.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
    },
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
        try {
          await emailService.sendVerificationEmail({
            to: user.email,
            token,
            url,
            name: user.name,
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
        try {
          await emailService.sendEmail({
            to: user.email,
            template: {
              type: 'email-forget-password',
              url,
              name: user.name,
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
      sveltekitCookies(getRequestEvent),
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

export function createAuth(
  db: DrizzleClient,
  emailService: EmailService,
  origin: string,
  platformEnv: App.Platform['env']
) {
  const key = Symbol.for('better-auth');
  if (authClientCache.has(key)) {
    // biome-ignore lint/style/noNonNullAssertion: <has() does the null check>
    return authClientCache.get(key)!;
  }

  const auth = createBetterAuth(db, emailService, origin, platformEnv);

  authClientCache.set(key, auth);
  return auth;
}
