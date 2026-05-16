# Webhooks

This project is a simple and quick way to create endpoints for quickly testing
webhooks.

## Features

Tech:

- Built with nuxt: 
  - https://nuxt.com/raw/docs/4.x/getting-started/introduction.md
- Frontend with Nuxt UI v4: 
  - https://ui.nuxt.com/raw/docs/components.md
- CSS styling with Tailwind: 
  - https://tailwindcss.com/docs
- tRPC via HTTP: 
  - https://trpc.io/docs
  - https://trpc-nuxt.pages.dev/setup/
- ORM via drizzle: 
  - https://orm.drizzle.team/docs/overview
- Linting + styling with eslint: 
  - https://eslint.nuxt.com/packages/module

Deploy:

- Deployed to Cloudflare workers:
  - https://developers.cloudflare.com/docs-for-agents/
- Database via Cloudflare's D1
  - https://developers.cloudflare.com/d1/
  - https://orm.drizzle.team/docs/connect-cloudflare-d1

## Development

### Setup

```bash
pnpm install
cp -v .env.example .env
pnpm run db:migrate
pnpm run dev
```

### Configuration

```env
# Database
DATABASE_URL=file:.data/db.sqlite

# AWS (S3) / Minio configuration
NUXT_AWS_BUCKET='uploads'
AWS_REGION='auto'
AWS_ACCESS_KEY_ID='minioadmin'
AWS_SECRET_ACCESS_KEY='minioadmin'
AWS_ENDPOINT_URL='http://localhost:9000'
```

### Running Locally

To start the development server with Nuxt:

```bash
pnpm run dev
```

For Cloudflare-specific development (using Wrangler):

```bash
pnpm run cf:dev
```

### Database Migrations

This project uses Drizzle ORM. Migrations are managed via `drizzle-kit` and
applied to Cloudflare D1.

1.  **Generate a new migration**: Run this after making changes to
    `server/db/schema.ts`.

    ```bash
    pnpm run db:generate
    ```

2.  **Apply migrations locally**: Apply migrations to your local D1 instance for
    development.

    ```bash
    pnpm run cf:migrate --local
    ```

3.  **Apply migrations to production**: Apply migrations to your remote D1
    database on Cloudflare.

    ```bash
    pnpm run cf:migrate --remote
    ```

### Cloudflare Bindings & Types

When you add or change bindings in `wrangler.jsonc` (like D1, R2, or Vectorize),
you should regenerate the TypeScript definitions:

```bash
pnpm run cf:types
```

This updates `shared/wrangler.d.ts` to ensure type safety for your Cloudflare
bindings.

## Deployment

Deploy the application to Cloudflare Workers:

```bash
pnpm run cf:deploy
```

## Useful Commands

- `pnpm lint`: Run ESLint checks.
- `pnpm lint:fix`: Automatically fix linting issues.
- `pnpm typecheck`: Run TypeScript type checks.
- `pnpm cf:types`: Generate types for Cloudflare bindings.
- `pnpm clean`: Remove build artifacts and temporary files.
