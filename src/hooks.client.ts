import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import type {HandleClientError} from "@sveltejs/kit";

Sentry.init({
  dsn: 'https://eb437cf4593e94a12bdd9873e5638929@o4508418462121984.ingest.us.sentry.io/4509486996127744',
  environment: import.meta.env.MODE || 'production',
  tracesSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // If you don't want to use Session Replay, just remove the line below:
  integrations: [replayIntegration()],
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError: HandleClientError = async ({ error, event, status, message }) => {
  console.error(error)
  const errorId = crypto.randomUUID();

  // example integration with https://sentry.io/
  Sentry.captureException(error, {
    extra: { event, errorId, status }
  });

  return {
    message: 'Whoops!',
    errorId
  };
};
