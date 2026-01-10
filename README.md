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

2.  **Apply migrations (local/remote)**: Apply migrations to your D1 database.
    ```bash
    pnpm run cf:migrate
    ```

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
