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

  // Check session for all authenticated routes
  const session = await event.locals.auth.api.getSession({
    headers: event.request.headers,
  });

  // Admin route protection
  if (event.url.pathname.startsWith('/admin')) {
    if (!session) {
      throw redirect(303, '/auth/login');
    }
  }

  // Check if user needs to complete profile (has session but no name)
  if (session?.user && !session.user.name) {
    // Define routes that don't require profile completion
    const allowedRoutes = [
      '/profile/complete',
      '/auth/logout',
      '/api/', // Allow API routes
    ];

    const isAllowedRoute = allowedRoutes.some(route =>
      event.url.pathname.startsWith(route)
    );

    // If not on an allowed route, redirect to profile completion
    if (!isAllowedRoute) {
      throw redirect(303, '/profile/complete');
    }
  }

  return svelteKitHandler({ event, resolve, auth: event.locals.auth });
};
