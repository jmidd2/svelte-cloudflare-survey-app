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
