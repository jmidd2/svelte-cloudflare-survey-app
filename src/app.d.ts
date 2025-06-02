// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { DefaultSession } from '@auth/core/types';
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
      auth: import('@auth/sveltekit').Session;
      db:
        | (import('drizzle-orm/libsql').LibSQLDatabase<
            typeof import('$lib/server/db/schema')
          > & { $client: import('drizzle-orm/libsql').Client })
        | (import('drizzle-orm/d1').DrizzleD1Database<
            typeof import('$lib/server/db/schema')
          > & { $client: D1Database });
    }

    interface PageData {
      session: import('@auth/sveltekit').Session | null;
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

declare module '@auth/core/providers/auth0' {
  interface Auth0Profile {
    user_metadata: {
      roles: string[];
      tenant: {
        id: string;
        name: string;
      };
    };
  }
}

declare module '@auth/core/types' {
  interface User extends AuthProfileUserMetadata {}

  interface Session {
    user: AuthProfileUserMetadata & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT extends AuthProfileUserMetadata {
    image: string | null;
  }
}
