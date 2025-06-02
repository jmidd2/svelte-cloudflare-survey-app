import { createDb } from '$lib/server/db';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { handle as authenticationHandle } from '$lib/auth';
import * as schema from '$lib/server/db/schema';

// import { handle as AuthenticationHandle } from '$lib/auth';
// import type {Handle} from "@sveltejs/kit";
// import {SvelteKitAuth} from "@auth/sveltekit";
// import Auth0 from "@auth/core/providers/auth0";

// export const handle: Handle = function({event:{platform}}) {
//     const {handle} = SvelteKitAuth({
//         trustHost: false,
//         providers: [Auth0({
//             clientId: platform?.env?.AUTH0_CLIENT_ID,
//             clientSecret: platform?.env?.AUTH0_CLIENT_SECRET,
//         })]
//     })
//
//
// }
const authorizationHandle: Handle = async ({ event, resolve }) => {
  // Protect any routes under /authenticated
  if (event.url.pathname.startsWith('/admin')) {
    const session = await event.locals.auth();

    if (event.url.pathname.startsWith('/admin/invite')) {
      return resolve(event);
    }

    if (session && session.user.tenant === undefined) {
      console.log('no tenant found for user', event);
      throw redirect(303, '/join-tenant');
    }

    if (!session) {
      // Redirect to the signin page
      throw redirect(303, '/login');
    }
  }

  // If the request is still here, just proceed as normally
  return resolve(event);
};
const dbLocalsHandle: Handle = async function ({ event, resolve }) {
  event.locals.db = await createDb({
    d1Database: event.platform?.env?.DB,
    dbUrl: env.DATABASE_URL,
    schema,
  });

  return await resolve(event);
};

export const handle: Handle = sequence(
  authenticationHandle,
  authorizationHandle,
  dbLocalsHandle
);
