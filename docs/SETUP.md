# Initializing Your Multi-Tenant Feedback System for Worker Deployment

This guide walks you through initializing your project for deployment as a Cloudflare Worker.

## Prerequisites

1. Node.js (v16.13.0 or later)
2. Cloudflare account
3. Domain name (optional for initial development)

## Step 1: Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

## Step 2: Authenticate with Cloudflare

```bash
# Log in to your Cloudflare account
wrangler login
```

This will open a browser window to authorize Wrangler to access your Cloudflare account.

## Step 3: Create a New Project

Unlike Pages deployment, for a Worker we'll start with a simpler template:

```bash
# Create a new directory for your project
mkdir feedback-system
cd feedback-system

# Initialize a new Node.js project
yarn init -y

# Install SvelteKit and Cloudflare adapter
yarn install -D svelte @sveltejs/kit @sveltejs/adapter-cloudflare-worker vite
```

## Step 4: Set Up SvelteKit

Create a basic SvelteKit structure:

```bash
# Create src directory and app subdirectory
mkdir -p src/app/routes src/app/lib

# Create basic app.html
echo '<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>' > src/app/app.html

# Create basic index route
mkdir -p src/app/routes/+page.svelte
echo '<h1>Multi-Tenant Feedback System</h1>' > src/app/routes/+page.svelte
```

## Step 5: Create Worker Entry Point

Create a worker entry point in `src/index.js`:

```bash
# Create src/index.js
echo 'import { SvelteKitWorker } from "@sveltejs/adapter-cloudflare";

// Create a SvelteKit Worker
const svelteKit = new SvelteKitWorker();

export default {
  async fetch(request, env, ctx) {
    // Pass the request to SvelteKit
    return svelteKit.fetch(request, env, ctx);
  }
};' > src/index.js
```

## Step 6: Create Svelte Configuration

Create `svelte.config.js`:

```bash
echo 'import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/kit/vite";

/** @type {import("@sveltejs/kit").Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    // Use Cloudflare adapter
    adapter: adapter(),
    
    // Use a relative path for assets
    paths: {
      relative: true
    },
    
    // Set the app directory
    files: {
      routes: "src/app/routes",
      lib: "src/app/lib",
      appTemplate: "src/app/app.html"
    }
  }
};

export default config;' > svelte.config.js
```

## Step 7: Create D1 Database

```bash
# Create main feedback database
wrangler d1 create feedback-db
# Note down the database_id that is output

# Create tenant management database (if using separate DB approach)
wrangler d1 create tenant-management-db
# Note down this database_id as well
```

## Step 8: Create KV Namespace

```bash
# Create a KV namespace for caching
wrangler kv:namespace create "CACHE"
# Note down the id that is output
```

## Step 9: Create Wrangler Configuration

Create a `wrangler.toml` file using the output from previous commands:

```bash
# Create wrangler.toml with the provided IDs
# See the "Updated wrangler.toml for Worker Deployment" artifact
```

## Step 10: Create Database Schema

Create a schema.sql file in your project root:

```bash
# Create schema file
touch schema.sql

# Add schema content (see Database Schema artifact)
```

## Step 11: Apply Database Schema

```bash
# Apply schema to the main database
wrangler d1 execute feedback-db --file=./schema.sql

# Apply schema to the tenant database if using separate DBs
wrangler d1 execute tenant-management-db --file=./tenant-schema.sql
```

## Step 12: Set Up Environment Secrets

```bash
# Set Auth0 credentials as secrets
wrangler secret put AUTH0_CLIENT_ID
# Enter your Auth0 client ID when prompted

wrangler secret put AUTH0_CLIENT_SECRET
# Enter your Auth0 client secret when prompted

# Generate a secure random string for AUTH_SECRET
# On Unix/Linux/Mac
AUTH_SECRET=$(openssl rand -hex 32)
echo $AUTH_SECRET
# Save this value, then set it as a secret
wrangler secret put AUTH_SECRET
# Enter the generated value when prompted
```

## Step 13: Install Additional Dependencies

```bash
# Install Auth0 and related dependencies
yarn install @auth/core @auth/sveltekit auth0 auth0-js @tsndr/cloudflare-worker-jwt 

# Install Drizzle ORM for database interactions
yarn install drizzle-orm
yarn install -D drizzle-kit

# Install other utilities
yarn install crypto-js jose
```

## Step 14: Update package.json

Update your `package.json` scripts:

```bash
# Update package.json scripts
echo '{
  "scripts": {
    "dev": "wrangler dev",
    "build": "vite build",
    "deploy": "wrangler deploy",
    "d1:migrate": "wrangler d1 execute feedback-db --local --file=./schema.sql",
    "d1:migrate:prod": "wrangler d1 execute feedback-db --file=./schema.sql"
  }
}' > package.json
```

## Step 15: Create Type Definitions

Create type definitions for your Cloudflare bindings:

```bash
# Create app/app.d.ts file
mkdir -p src/app
echo '/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Locals {
      auth: import("@auth/sveltekit").Session;
    }
    interface PageData {
      session: import("@auth/sveltekit").Session | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        TENANT_DB: D1Database;
        ANALYTICS: AnalyticsEngineDataset;
        CACHE: KVNamespace;
        AUTH0_CLIENT_ID: string;
        AUTH0_CLIENT_SECRET: string;
        AUTH0_DOMAIN: string;
        AUTH_SECRET: string;
      };
      context: {
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}

export {};' > src/app/app.d.ts
```

## Step 16: Run Development Server

```bash
# Start the development server with D1 bindings
wrangler dev --d1=DB:feedback-db --d1=TENANT_DB:tenant-management-db --kv=CACHE:YOUR_KV_ID
```

## Step 17: Deploy to Cloudflare Worker

```bash
# Build and deploy your application
yarn run build
wrangler deploy
```

## Next Steps

After deploying:

1. Configure Auth0 with your production Worker URL
2. Set up your domain/routes if using a custom domain
3. Implement the application features (forms, admin dashboard, etc.)

This initialization process sets up your project for deployment as a Cloudflare Worker, which will provide better control over the runtime environment and request handling for your multi-tenant feedback system.