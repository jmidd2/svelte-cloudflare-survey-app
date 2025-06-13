import { sentrySvelteKit } from "@sentry/sveltekit";
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import TurboConsole from 'unplugin-turbo-console/vite'

export default defineConfig({
	plugins: [sentrySvelteKit({
        sourceMapsUploadOptions: {
					telemetry: false,
            org: "jmidd-dev",
            project: "feedback-app",
					authToken: process.env.SENTRY_AUTH_TOKEN,
        }
    }), TurboConsole(), tailwindcss(), sveltekit()],
	server: {
		watch: {
			ignored: '**/*.md'
		}
	},
	build:{
		rollupOptions:{
			external:['react', '@react-email']
		}
	},
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});