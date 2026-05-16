# Webhooks

A lightweight tool for creating instant HTTP endpoints to inspect and test webhook payloads. Create an endpoint, point your service at it, and watch requests roll in with full headers, body, query params, and Cloudflare metadata.

## Features

- **Instant endpoints** — create a webhook URL in one click, no account required
- **Live request log** — polls every 5 seconds, auto-stops after 8 minutes
- **Configurable responses** — set status code, content type, body, and response delay per endpoint
- **CORS support** — toggle `Access-Control-Allow-*` headers per endpoint
- **Request inspector** — drill into headers, body, query params, and Cloudflare geo/network properties
- **Stats dashboard** — charts for HTTP methods, geographic origin, network, and request timing
- **Export** — download all captured requests as JSON

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) |
| UI | [Nuxt UI v4](https://ui.nuxt.com) + [Tailwind CSS](https://tailwindcss.com) |
| API | [tRPC](https://trpc.io) via [trpc-nuxt](https://trpc-nuxt.pages.dev) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Charts | [ECharts](https://echarts.apache.org) via [nuxt-echarts](https://nuxt-echarts.pages.dev) |
| Utilities | [VueUse](https://vueuse.org) |
| Hosting | [Cloudflare Workers](https://developers.cloudflare.com/workers/) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |

## Architecture

```
server/
  api/h/[id].ts         # webhook receiver — accepts any method, logs request, returns configured response
  middleware/context.ts  # initializes Drizzle DB + WebhookRepo on every request
  trpc/webhook.ts        # tRPC router: create, config, list, get, update, clear, delete
  utils/repo.ts          # WebhookRepo — all DB queries
  db/schema.ts           # two tables: webhooks + requests

app/pages/
  w/[wid].vue            # dashboard — request list with search, export, clear
  w/[wid]/r/[rid].vue    # request detail — headers, body, query params, CF properties
  w/[wid]/s.vue          # stats — geo, method, network, timing charts
  w/[wid]/c.vue          # webhook config — response settings
```

## Development

### Setup

```bash
pnpm install
cp -v .env.example .env
pnpm run db:migrate
pnpm run dev
```

### Environment Variables

```env
DATABASE_URL=file:.data/db.sqlite
```

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Nuxt dev server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | TypeScript type check |
| `pnpm db:generate` | Generate Drizzle migration after schema changes |
| `pnpm cf:migrate --local` | Apply migrations to local D1 |
| `pnpm cf:migrate --remote` | Apply migrations to production D1 |
| `pnpm cf:types` | Regenerate Cloudflare binding types (`shared/wrangler.d.ts`) |
| `pnpm cf:deploy` | Build and deploy to Cloudflare Workers |
| `pnpm clean` | Remove `.output`, `.wrangler`, `.nuxt` |

### Cloudflare Local Dev (Wrangler)

```bash
pnpm run cf:dev
```

## Deployment

```bash
pnpm run cf:deploy
```
