// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type {
  AnalyticsEngineDataset,
  D1Database,
  KVNamespace,
} from '@cloudflare/workers-types';

declare global {
  namespace App {
    // interface Error {}
    // interface PageState {}
    interface Locals {
      auth: import('@auth/sveltekit').Session;
    }
    interface PageData {
      session: import('@auth/sveltekit').Session | null;
    }
    interface Platform {
      env?: {
        FEEDBACK_DB: D1Database;
        TENANT_DB: D1Database;
        ANALYTICS: AnalyticsEngineDataset;
        CACHE: KVNamespace;
        AUTH_AUTH0_ID: string;
        AUTH_AUTH0_SECRET: string;
        AUTH_AUTH0_ISSUER: string;
        AUTH_AUTH0_AUTHORIZATION: string;
        AUTH_SECRET: string;
      };
      context: {
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}
