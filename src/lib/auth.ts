import Auth0, { type Auth0Profile } from '@auth/core/providers/auth0';
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit';

export const { handle, signIn, signOut } = SvelteKitAuth(async req => {
  if (!req.platform) throw new Error('Unsupported platform');

  const {
    platform: { env },
  } = req;

  return {
    secret: env?.AUTH_SECRET,
    trustHost: true,
    debug: true,
    providers: [
      Auth0({
        wellKnown: '',
        clientId: env?.AUTH_AUTH0_ID,
        clientSecret: env?.AUTH_AUTH0_SECRET,
        issuer: env?.AUTH_AUTH0_ISSUER,
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
