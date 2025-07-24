import { APIError } from 'better-call';
import type { createAuth } from '$lib/server/auth/create-auth';

export * from './check-permissions';
export * from './create-auth';

/**
 * @fileoverview Authentication module providing BetterAuth configuration and permission utilities.
 *
 * This module exports functions for creating authentication instances with email/password,
 * OTP verification, organization management, and permission checking capabilities.
 * It includes database hooks for user lifecycle events and comprehensive email service integration.
 *
 * @author Jon Middleton
 * @version 1.0.0
 */

// TODO: create load wrapper for requireAuth or requirePermission
/** Required for BetterAuth CLI to generate the schema **/
// export const auth = betterAuth({
//   database: drizzleAdapter(
//     await createDbClient({ dbUrl: 'file:local-tenant.db', schema }),
//     {
//       schema,
//       provider: 'sqlite',
//       usePlural: true,
//     }
//   ),
//   emailAndPassword: {
//     enabled: true,
//     disableSignUp: false,
//   },
//   plugins: [
//     admin({
//       defaultRole: 'user',
//     }),
//     emailOTP({
//       async sendVerificationOTP({ otp, email, type }) {
//         console.log(`send otp to ${email} for ${type} with OTP: ${otp}`);
//       },
//     }),
//     organization(),
//   ],
// });
export type AuthProvider = ReturnType<typeof createAuth>;
export type AuthApi = AuthProvider['api'];
/**
 * Default admin role constant used throughout the application.
 * @constant {string}
 */
export const ADMIN_ROLE = 'admin';

export async function checkOrganizationSlug(
  authApi: AuthApi,
  headers: Headers,
  slug: string
): Promise<boolean> {
  try {
    /**
     *
     * Who made this api??
     * this will throw an APIError like:
     *
     * [APIError: slug is taken] {
     *   status: 'BAD_REQUEST',
     *   body: { code: 'SLUG_IS_TAKEN', message: 'slug is taken' },
     *   headers: {},
     *   statusCode: 400
     * }
     * when the slug is taken and { status: true } when it's available
     * so now instead of handling this with a false status or something, it has to be done in the catch
     */
    await authApi.checkOrganizationSlug({
      headers,
      body: {
        slug,
      },
    });

    return true;
  } catch (e) {
    if (e instanceof APIError) {
      if (e.body?.code === 'SLUG_IS_TAKEN') {
        return false;
      }
    }

    console.error('error creating organization', e);
    throw e;
  }
}
