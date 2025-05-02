// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { DefaultSession } from '@auth/core/types';
import type {
  AnalyticsEngineDataset,
  D1Database,
  KVNamespace,
} from '@cloudflare/workers-types';

export interface AuthProfileUserMetadata {
  roles: string[];
  tenant: {
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
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}

declare module '@auth/core/providers/auth0' {
  interface Auth0Profile {
    user_metadata: AuthProfileUserMetadata;
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
