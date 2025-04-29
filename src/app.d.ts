// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import {KVNamespace, D1Database, AnalyticsEngineDataset} from "@cloudflare/workers-types"

declare global {
	namespace App {
		// interface Error {}
		// interface PageState {}
		interface Locals {
			auth: import("@auth/sveltekit").Session;
		}
		interface PageData {
			session: import("@auth/sveltekit").Session | null;
		}
		interface Platform {
			env? : {
				FEEDBACK_DB: D1Database;
				TENANT_DB: D1Database;
				ANALYTICS: AnalyticsEngineDataset;
				CACHE: KVNamespace;
				AUTH0_CLIENT_ID: string;
				AUTH0_CLIENT_SECRET: string;
				AUTH_SECRET: string;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			}
		}
	}
}

export {};
