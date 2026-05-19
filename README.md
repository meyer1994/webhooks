# Webhooks

A lightweight tool for creating instant HTTP endpoints to inspect and test
webhook payloads. Create an endpoint, point your service at it, and watch
requests roll in with full headers, body, query params, and Cloudflare metadata.

## Features

- **Instant endpoints** — URL generated on page load, no account required
- **Live request log** — polls every 5 seconds, auto-stops after 8 minutes
- **Configurable responses** — set status code, content type, body, and response
  delay per endpoint
- **CORS support** — toggle `Access-Control-Allow-*` headers per endpoint
- **Request inspector** — drill into headers, body, query params, and Cloudflare
  geo/network properties
- **Replay & cURL export** — resend any captured request or copy it as a cURL command
- **Analytics dashboard** — charts for HTTP methods, geographic origin, network, and
  request timing
- **Export** — download all captured requests as JSON

## Tech Stack

| Layer     | Technology                                                                               |
| --------- | ---------------------------------------------------------------------------------------- |
| Framework | [Nuxt 4](https://nuxt.com)                                                               |
| UI        | [Nuxt UI v4](https://ui.nuxt.com) + [Tailwind CSS](https://tailwindcss.com)              |
| API       | [tRPC](https://trpc.io) via [trpc-nuxt](https://trpc-nuxt.pages.dev)                     |
| ORM       | [Drizzle ORM](https://orm.drizzle.team)                                                  |
| Charts    | [ECharts](https://echarts.apache.org) via [nuxt-echarts](https://nuxt-echarts.pages.dev) |
| Utilities | [VueUse](https://vueuse.org)                                                             |
| Hosting   | [Cloudflare Workers](https://developers.cloudflare.com/workers/)                         |
| Database  | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)                          |

## Architecture

```
server/
  api/h/[id].ts         # webhook receiver — accepts any method, logs request, returns configured response
  middleware/context.ts  # initializes Drizzle DB + WebhookRepo on every request
  trpc/webhook.ts        # tRPC router: create, config, list, get, update, clear, delete
  utils/repo.ts          # WebhookRepo — all DB queries
  db/schema.ts           # two tables: webhooks + requests

app/pages/
  index.vue              # landing page — auto-generates a webhook URL on load
  w/[wid].vue            # dashboard — request list with search, export, clear
  w/[wid]/r/[rid].vue    # request detail — headers, body, query params, CF properties, replay
  w/[wid]/c.vue          # analytics — geo, method, network, and timing charts
  w/[wid]/s.vue          # settings — response config (status, body, delay, CORS)
```

## Development

### Setup

```bash
pnpm install
pnpm run db:migrate
pnpm run dev
```

### Commands

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `pnpm dev`          | Start Nuxt dev server                                        |
| `pnpm test`         | Run test suite                                               |
| `pnpm lint`         | Run ESLint                                                   |
| `pnpm lint:fix`     | Auto-fix lint issues                                         |
| `pnpm typecheck`    | TypeScript type check                                        |
| `pnpm preview`      | Preview production build locally                             |
| `pnpm db:generate`  | Generate Drizzle migration after schema changes              |
| `pnpm db:migrate`   | Apply migrations to local D1                                 |
| `pnpm cf:types`     | Regenerate Cloudflare binding types (`shared/wrangler.d.ts`) |
| `pnpm cf:deploy`    | Build and deploy to Cloudflare Workers                       |
| `pnpm clean`        | Remove `.output`, `.wrangler`, `.nuxt`                       |
| `pnpm reset`        | Full clean reinstall + lint + typecheck + build              |

## Deployment

```bash
pnpm run cf:deploy
```
