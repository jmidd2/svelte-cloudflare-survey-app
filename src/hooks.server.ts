import { createDb } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { env } from '$env/dynamic/private';
import { handle as authHandle } from '$lib/auth';
import * as feedbackSchema from '$lib/server/db/feedback-schema';
import * as tenantSchema from '$lib/server/db/tenant-schema';

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

const dbLocalsHandle: Handle = async function ({ event, resolve }) {
  event.locals.feedbackDb = await createDb({
    d1Database: event.platform?.env?.FEEDBACK_DB,
    dbUrl: env.FEEDBACK_DB_URL,
    schema: feedbackSchema,
  });

  event.locals.tenantDb = await createDb({
    d1Database: event.platform?.env?.TENANT_DB,
    dbUrl: env.TENANT_DB_URL,
    schema: tenantSchema,
  });

  console.log(event.locals.feedbackDb);

  const response = await resolve(event);
  return response;
};

export const handle: Handle = sequence(authHandle, dbLocalsHandle);
