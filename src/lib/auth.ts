import Auth0 from '@auth/core/providers/auth0';
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
        clientId: env?.AUTH_AUTH0_ID,
        clientSecret: env?.AUTH_AUTH0_SECRET,
        issuer: env?.AUTH_AUTH0_ISSUER,
        authorization: 'https://dev-f7wd881wsk8er6ir.us.auth0.com/authorize',
        profile: (profile, tokens) => {
          console.log('profile', profile, tokens);
          return profile;
        },
      }),
    ],
    callbacks: {
      jwt: params => {
        console.log('jwt', params);

        return params.token;
      },
      signIn: params => {
        console.log('signin', params);

        return true;
      },
      session: params => {
        console.log('session', params);

        return params.session;
      },
    },
  } satisfies SvelteKitAuthConfig;
});
