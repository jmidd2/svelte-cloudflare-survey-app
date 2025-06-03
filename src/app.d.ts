// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AuthProvider } from '$lib/auth';
import type {
  AnalyticsEngineDataset,
  D1Database,
  KVNamespace,
} from '@cloudflare/workers-types';

export interface AuthProfileUserMetadata {
  roles?: string[];
  tenant?: {
    id: string;
    name: string;
  };
}

declare global {
  namespace App {
    // interface Error {}
    // interface PageState {}
    interface Locals {
      auth: AuthProvider;
      db:
        | (import('drizzle-orm/libsql').LibSQLDatabase<
            typeof import('$lib/server/db/schema')
          > & { $client: import('drizzle-orm/libsql').Client })
        | (import('drizzle-orm/d1').DrizzleD1Database<
            typeof import('$lib/server/db/schema')
          > & { $client: D1Database });
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
      };
      context: {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}
