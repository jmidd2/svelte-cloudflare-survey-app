import { env } from '$env/dynamic/private';
import { createAuth } from '$lib/auth';
import { createDbClient } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { createEmailService } from '$lib/server/email';
import { type Handle, redirect } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async function ({ event, resolve }) {
  event.locals.db = await createDbClient({
    d1Database: event.platform?.env?.DB,
    dbUrl: env.DATABASE_URL,
    schema,
  });

  const isEmailDisabled =
    env.DISABLE_EMAIL === 'true' || env.DISABLE_EMAIL === '1';

  if (event.platform?.env?.RESEND_API_KEY) {
    event.locals.mailService = createEmailService(
      event.platform?.env?.RESEND_API_KEY || 'dummy-key',
      event.platform?.env?.EMAIL_FROM ?? 'no-reply@jmidd.dev',
      isEmailDisabled
    );
  } else {
    throw new Error(
      'email service could not be configured. missing RESEND_API_KEY (or set DISABLE_EMAIL=true for development)'
    );
  }

  event.locals.auth = createAuth(event.locals.db, event.locals.mailService);
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
