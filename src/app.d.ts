// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AuthApi, AuthProvider } from '$lib/server/auth';
import type { DrizzleClient } from '$lib/server/db';
import type { EmailService } from '$lib/server/email';
import type {
  AnalyticsEngineDataset,
  D1Database,
  KVNamespace,
} from '@cloudflare/workers-types';
import type { ToastTypes } from 'svelte-sonner/dist/types';

declare global {
  namespace App {
    namespace SuperForms {
      type Message = {
        type: ToastTypes;
        message: string;
      };
    }
    // interface Error {}
    // interface PageState {}
    interface Locals {
      auth: AuthApi;
      mailService: EmailService;
      db: DrizzleClient;
      authHandler: Omit<AuthProvider, 'api'>;
    }

    interface Platform {
      env?: {
        DB: D1Database;
        ANALYTICS: AnalyticsEngineDataset;
        CACHE: KVNamespace;
        AUTH_AUTH0_ID: string;
        AUTH_AUTH0_SECRET: string;
        AUTH_AUTH0_ISSUER: string;
        AUTH_AUTH0_AUTHORIZATION: string;
        AUTH_SECRET: string;
        AUTH_MAX_AGE: string;
        RESEND_API_KEY: string;
        EMAIL_FROM: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
      };
      context: {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}
