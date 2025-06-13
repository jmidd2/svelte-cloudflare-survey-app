import { env } from '$env/dynamic/private';
import { createAuth } from '$lib/auth';
import { createDbClient } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { createEmailService } from '$lib/server/email';
import * as Sentry from '@sentry/cloudflare';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = sequence(
  ({ event, resolve }) => {
    if (!event.platform) throw new Error('platform not found');

    return Sentry.wrapRequestHandler(
      {
        options: {
          dsn: 'https://eb437cf4593e94a12bdd9873e5638929@o4508418462121984.ingest.us.sentry.io/4509486996127744',
          tracesSampleRate: 1.0,
          _experiments: {
            enableLogs: true,
          },
          environment: process.env.NODE_ENV || 'production',
        },
        request: event.request,
        context: event.platform.context,
      },
      () => resolve(event)
    );
  },
  // initCloudflareSentryHandle({
  //   enabled: env.NODE_ENV === 'production',
  //   debug: false,
  //   dsn: 'https://eb437cf4593e94a12bdd9873e5638929@o4508418462121984.ingest.us.sentry.io/4509486996127744',
  //   tracesSampleRate: 1,
  // }),
  // sentryHandle(),
  async function ({ event, resolve }) {
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
  }
);

export const handleError = handleErrorWithSentry();
