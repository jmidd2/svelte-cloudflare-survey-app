import { env } from '$env/dynamic/private';
import { createAuth } from '$lib/server/auth/create-auth';
import { createDbClient } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { requests } from '$lib/server/db/schema';
import { createEmailService } from '$lib/server/email';
import * as Sentry from '@sentry/cloudflare';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { eq } from 'drizzle-orm';

let isBuilding: boolean | undefined;
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
    // Only check building state once and cache it to skip steps during SSR
    if (isBuilding === undefined) {
      //@ts-expect-error
      const { building } = await import('$app/environment')
        .catch(e => {})
        .then(m => m || {});

      isBuilding = building;
    }
    if (!isBuilding) {
      event.locals.db = await createDbClient({
        d1Database: event.platform?.env?.DB,
        dbUrl: env.DATABASE_URL,
        schema,
      });

      const isEmailDisabled =
        env.DISABLE_EMAIL === 'true' || env.DISABLE_EMAIL === '1';

      if (event.platform?.env?.RESEND_API_KEY && !event.locals.mailService) {
        event.locals.mailService = createEmailService(
          event.platform?.env?.RESEND_API_KEY ?? 'dummy-key',
          event.platform?.env?.EMAIL_FROM ?? 'no-reply@jmidd.dev',
          isEmailDisabled
        );
      } else {
        throw new Error(
          'email service could not be configured. missing RESEND_API_KEY (or set DISABLE_EMAIL=true for development)'
        );
      }

      if (!(event.locals.auth && event.locals.authHandler)) {
        const { api, ...authHandler } = createAuth(
          event.locals.db,
          event.locals.mailService,
          event.url.origin,
          event.platform?.env
        );

        event.locals.authHandler = authHandler;

        event.locals.auth = api;
      }

      // Check session for all authenticated routes
      const session = await event.locals.auth.getSession({
        headers: event.request.headers,
      });

      // Admin route protection
      if (event.url.pathname.startsWith('/admin')) {
        if (!session) {
          throw redirect(303, '/login');
        }
      }

      // Check if user needs to complete profile
      if (session?.user) {
        const missingName = !session.user.name;

        // Check organization membership (requires active session)
        const memberOfOrganizations = await event.locals.auth.listOrganizations(
          {
            headers: event.request.headers,
          }
        );

        const missingOrganization = memberOfOrganizations.length === 0;
        const requestsToJoin = await event.locals.db
          .select()
          .from(requests)
          .where(eq(requests.userId, session.user.id));

        // If a user is missing organization membership and has requests to join, don't require org
        let orgRequired = missingOrganization;
        if (requestsToJoin.length > 0 && missingOrganization) {
          orgRequired = false;
        }

        // If user is missing name or organization membership
        if (missingName || orgRequired) {
          // Define routes that don't require profile completion
          const allowedRoutes = [
            '/profile/complete',
            '/auth/logout',
            '/accept-invitation',
            '/api/', // Allow API routes
          ];

          const isAllowedRoute = allowedRoutes.some(route =>
            event.url.pathname.startsWith(route)
          );

          // If not on an allowed route, redirect to profile completion
          if (!isAllowedRoute) {
            if (missingName) {
              console.log('Redirecting to profile completion, missing name');
            }
            if (missingOrganization) {
              console.log('Redirecting to profile completion, missing org');
            }
            throw redirect(303, '/profile/complete');
          }
        }
      }
    }

    return svelteKitHandler({
      event,
      resolve,
      auth: event.locals.authHandler,
    });
  }
);
export const handleError: HandleServerError = async ({
  error,
  event,
  status,
  message,
}) => {
  console.error(error);
  const errorId = crypto.randomUUID();

  // example integration with https://sentry.io/
  Sentry.captureException(error, {
    extra: { event, errorId, status },
  });

  return {
    message: 'Whoops!',
    errorId,
  };
};
