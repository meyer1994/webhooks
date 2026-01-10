# Flower

Flower is a modern Vue 3 + Nuxt 4 application designed for document processing
with AI integration, leveraging Cloudflare's ecosystem for performance and
scalability.

## Features

- **Frontend**: [Nuxt 4](https://nuxt.com/blog/nuxt-4-0) with [Vue
  3](https://vuejs.org/) and [Nuxt UI 4](https://ui4.nuxt.com/).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) and [Nuxt
  UI](https://ui4.nuxt.com/).
- **API**: Type-safe communication using [tRPC](https://trpc.io/).
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with [Cloudflare
  D1](https://developers.cloudflare.com/d1/).
- **AI/LLM**: [LangChain](https://js.langchain.com/) and
  [LangGraph](https://langchain-ai.github.io/langgraphjs/) integrated with
  [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/).
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) for object
  storage.
- **Vector Search**: [Cloudflare
  Vectorize](https://developers.cloudflare.com/vectorize/) for semantic search.
- **Authentication**: `nuxt-auth-utils` with Auth0 support.
- **Developer Experience**: ESLint Stylistic, TypeScript strict mode, and pnpm.

## Development

### Setup

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd nuxt-template
    ```

2.  **Install dependencies**:

    ```bash
    pnpm install
    ```

3.  **Configure environment**: Copy the example environment file and fill in the
    required values.

    ```bash
    cp .env.example .env
    ```

    The following variables are configurable in `.env`:

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
