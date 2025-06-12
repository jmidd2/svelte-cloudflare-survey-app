import type { AuthProvider } from '$lib/auth';
import {
  adminClient,
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  // baseURL: "http://localhost:3000"
  plugins: [
    inferAdditionalFields<AuthProvider>(),
    adminClient(),
    emailOTPClient(),
    organizationClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
