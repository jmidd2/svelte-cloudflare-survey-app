import { env } from '$env/dynamic/private';
import { createAuth } from '$lib/auth';
import { createDbClient } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { type Handle, redirect } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async function ({ event, resolve }) {
  event.locals.db = await createDbClient({
    d1Database: event.platform?.env?.DB,
    dbUrl: env.DATABASE_URL,
    schema,
  });

  event.locals.auth = createAuth(event.locals.db);
  if (event.url.pathname.startsWith('/admin')) {
    const session = await event.locals.auth.api.getSession({
      headers: event.request.headers,
    });
    console.log('hook session----', session);

    if (!session) {
      // Redirect to the signin page
      throw redirect(303, '/auth/login');
    }
  }

  return svelteKitHandler({ event, resolve, auth: event.locals.auth });
};
