import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, emailOTP, organization } from 'better-auth/plugins';
import { type DrizzleClient, createDbClient } from './server/db';
import * as schema from './server/db/schema';

export function createAuth(db: DrizzleClient) {
  return betterAuth({
    database: drizzleAdapter(db, {
      schema,
      provider: 'sqlite',
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      admin(),
      emailOTP({
        async sendVerificationOTP({ otp, email, type }) {
          console.log(`TODO:send otp to ${email} for ${type} with OTP: ${otp}`);
        },
      }),
      organization(),
    ],
  });
}

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
//         console.log(`TODO:send otp to ${email} for ${type} with OTP: ${otp}`);
//       },
//     }),
//     organization(),
//   ],
// });

export type AuthProvider = ReturnType<typeof createAuth>;
// export type Session = ReturnType<typeof createAuth>.$Infer.Session;
