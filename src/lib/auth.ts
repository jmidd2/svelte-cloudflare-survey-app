import Auth0, { type Auth0Profile } from '@auth/core/providers/auth0';
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';
import z from 'zod';

const DEFAULT_MAX_AGE = 24 * 60 * 60; // 1 day

export const { handle, signIn, signOut } = SvelteKitAuth(async req => {
  if (!req.platform) throw new Error('Unsupported platform');

  const {
    platform: { env },
  } = req;

  const authEnvSchema = z.object({
    AUTH_AUTH0_ID: z.string(),
    AUTH_AUTH0_SECRET: z.string(),
    AUTH_AUTH0_ISSUER: z.string(),
    AUTH_SECRET: z.string(),
    AUTH_MAX_AGE: z.coerce.number(),
  });

  const {
    AUTH_MAX_AGE,
    AUTH_AUTH0_ISSUER,
    AUTH_AUTH0_SECRET,
    AUTH_SECRET,
    AUTH_AUTH0_ID,
  } = authEnvSchema.parse(env);

  return {
    secret: AUTH_SECRET,
    trustHost: true,
    debug: true,
    jwt: {
      maxAge: AUTH_MAX_AGE ?? DEFAULT_MAX_AGE,
    },
    cookies: {
      sessionToken: {
        options: {
          maxAge: AUTH_MAX_AGE ?? DEFAULT_MAX_AGE, // 1 day
        },
      },
    },
    providers: [
      Auth0({
        wellKnown: '',
        clientId: AUTH_AUTH0_ID,
        clientSecret: AUTH_AUTH0_SECRET,
        issuer: AUTH_AUTH0_ISSUER,
        authorization: {
          url: 'https://dev-f7wd881wsk8er6ir.us.auth0.com/authorize',
          params: {
            scope: 'openid profile email',
          },
        },
        profile: profile => {
          const { roles, tenant } = profile.user_metadata as {
            roles: string[];
            tenant: {
              id: string;
              name: string;
            };
          };

          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            // Map the custom properties
            roles,
            tenant,
          };
        },
      }),
    ],
    callbacks: {
      jwt: ({ token, user }) => {
        if (!token.image && user?.image) {
          token.image = user.image;
        }

        if (!token.roles && user?.roles) {
          token.roles = user.roles;
        }
        if (!token.tenant && user?.tenant) {
          token.tenant = user.tenant;
        }

        return { ...token };
      },
      session: ({ session, token }) => {
        if (session && token) {
          session.user.image = token.image;
          session.user.roles = token.roles;
          session.user.tenant = token.tenant;
        }

        return session;
      },
    },
  } satisfies SvelteKitAuthConfig;
});
