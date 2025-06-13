# Feedback App

A modern anonymous feedback application built with SvelteKit, Cloudflare Workers, and Drizzle ORM.

## Features

- 🔒 Anonymous feedback collection
- ⚡ Real-time feedback management
- 🔐 Authentication via One Time Password or Single-Sign On
- 📧 Email notifications via Resend
- 🗄️ SQLite (Local Dev) / Cloudflare D1 (Production) database with Drizzle ORM
- ☁️ Deployed on Cloudflare Workers
- 🐛 Error monitoring with Sentry
- 📘 TypeScript support
- 🧪 TODO:Comprehensive testing suite

## Tech Stack

- **Framework**: SvelteKit
- **Runtime**: Cloudflare Workers
- **Database**: SQLite (Local Dev) / Cloudflare D1 (Production) with Drizzle ORM
- **Authentication**: Better Auth
- **Email**: Resend
- **Styling**: TailwindCSS with svelte-shadcn
- TODO:**Testing**: Vitest + Playwright
- **Monitoring**: Sentry

## Prerequisites

- Node.js 18+
- Yarn package manager
- Cloudflare account (for deployment)

## 🏗️ Developing

1. Clone the repository and install dependencies:

```bash
yarn install
```

2. Configure the [**required environment variables**](#environment)

3. Set up the database:

```bash
yarn db:migrate
yarn db:seed
```

4. Start the development server:

```bash
yarn dev

# or start the server and open the app in a new browser tab
yarn dev --open
```

## 🏢 Building

To create a production version of your app:

```bash
yarn build
```

You can preview the production build with `yarn preview`.

## TODO:🧪 Testing

Run unit tests:

```bash
yarn test:unit
```

Run end-to-end tests:

```bash
yarn test:e2e
```

Run all tests:

```bash
yarn test
```

## 🗄️ Database Management

- **Push schema changes**: `yarn db:push`
- **Generate migrations**: `yarn db:generate`
- **Run migrations**: `yarn db:migrate`
- **Open database studio**: `yarn db:studio`
- **Seed database**: `yarn db:seed`

## 🚀 Deployment

Deploy to Cloudflare Workers:

```bash
yarn deploy
```

## ⚙️ Environment

### ☁️ Cloudflare Variables

For local development put these in `.dev.vars`

```
AUTH_AUTH0_ID
AUTH_AUTH0_SECRET
AUTH_SECRET
AUTH_MAX_AGE=86400
RESEND_API_KEY
EMAIL_FROM=noreply@jmidd.dev
```

### 🐛 Sentry Config

To upload source maps during `yarn build` put this in `.env.sentry-build-plugin`

```
SENTRY_AUTH_TOKEN
SENTRY_ORG=jmidd-dev
SENTRY_PROJECT=feedback-app
```

### 🔧 Non-Secret Variables

These go in your `.env`

```
DATABASE_URL=file:local-tenant.db
DISABLE_EMAIL=true
```

## 📚 Documentation

Additional documentation can be found in the `/docs` directory:

- TODO:[Setup Guide](docs/SETUP.md) 🛠️
- TODO:[Wrangler Configuration](docs/Wrangler.md) ⚙️
- TODO:[Analytics](docs/ANALYTICS.md) 📊

## 🧰 Development Tools

- **Code Formatting**: Biome
- **Type Checking**: `yarn check`
- **Cloudflare Types**: `yarn cf-typegen`
- **Auth Schema Generation**: `yarn auth:schema`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `yarn test`
5. Submit a pull request

## TODO:📄 License

[Add your license information here]

```