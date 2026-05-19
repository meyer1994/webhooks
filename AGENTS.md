# Webhooks Agent Guide

Vue 3 + Nuxt 4 + tRPC app deployed on Cloudflare Workers with D1 (SQLite).

## Stack

- **Frontend**: Vue 3, Nuxt 4, Nuxt UI, VueUse
- **Backend**: tRPC, Drizzle ORM, H3
- **DB**: Cloudflare D1 (SQLite)
- **Package Manager**: pnpm

## Structure

```
├── app/                    # Frontend (Vue/Nuxt)
│   ├── components/
│   ├── pages/
│   └── plugins/            # trpc.ts
├── server/
│   ├── api/h/[id].ts       # Webhook receiver endpoint
│   ├── api/trpc/           # tRPC endpoint
│   ├── db/                 # schema.ts, migrations/
│   ├── middleware/         # context.ts (attaches db + repo)
│   ├── trpc/               # tRPC procedures
│   └── utils/              # repo.ts, trpc.ts
├── tests/nuxt/             # vitest + @nuxt/test-utils tests
└── drizzle.config.ts
```

---

## Commands

### Dev

```bash
pnpm dev          # start Nuxt dev server (localhost:3000)
pnpm build        # production build
pnpm preview      # preview production build locally
pnpm typecheck    # TypeScript type check
pnpm lint         # run ESLint
pnpm lint:fix     # auto-fix lint issues
pnpm test         # run all tests (vitest, verbose, no watch)
pnpm test -- --reporter dot  # quieter test output
pnpm clean        # remove .output .wrangler .nuxt
```

### Database (Drizzle + Wrangler D1)

```bash
pnpm db:generate              # generate migration after schema changes
pnpm db:migrate               # apply migrations to local D1 (--local)
pnpm db:migrate:remote        # apply migrations to production D1 (--remote)

# Direct wrangler D1 commands
wrangler d1 create <name>                        # create a new D1 database
wrangler d1 execute <name> --local --command "SELECT * FROM webhooks LIMIT 5"
```

### Cloudflare Setup (first deploy)

```bash
# 1. Create D1 database — copy the database_id into wrangler.jsonc
wrangler d1 create webhooks

# 2. Apply migrations to production
pnpm db:migrate:remote

# 3. Regenerate TypeScript bindings after changing wrangler.jsonc
pnpm cf:types   # runs: wrangler types shared/wrangler.d.ts

# 4. Deploy
pnpm cf:deploy  # runs: nuxt build && wrangler --cwd .output deploy
```

### Local secrets

Create a `.dev.vars` file (gitignored) for local Wrangler dev — equivalent to
`.env` but for `wrangler dev`:

```bash
SECRET_KEY=my-local-secret
```

---

## Bash Tips

### Inspect JSON

```bash
cat file.json | jq '.'                    # pretty-print
cat file.json | jq '.key'                 # extract field
cat file.json | jq '.[0]'                 # first array element
cat file.json | jq '[.[] | .id]'          # map over array
curl -s http://localhost:3000/api/... | jq '.'
```

### Query structured data (CSV, JSON, Parquet) with DuckDB

```bash
duckdb -c "SELECT * FROM 'file.csv' LIMIT 10"
duckdb -c "SELECT * FROM 'file.json' WHERE id = '123'"
duckdb -c "SELECT * FROM 'file.parquet' LIMIT 5"
duckdb -c "SELECT method, COUNT(*) FROM 'requests.json' GROUP BY method"
```

### Search code

```bash
grep -rin 'pattern' .                    # recursive, case-insensitive, with line numbers
grep -rin 'pattern' . --include='*.ts'   # limit to file type
grep -rin 'pattern' . --exclude-dir=node_modules
```

### Find files

```bash
find . -name '*.vue'                          # by name
find . -name '*.ts' -not -path '*/node_modules/*'
find . -newer some-file.ts                    # modified after a reference file
```

### Inspect files and directories

```bash
ls -lh                  # sizes and timestamps, human-readable
ls -lht                 # sort by modification time (newest first)
du -sh *                # disk usage per item
wc -l file.ts           # line count
```

---

## Database (Drizzle)

Always access the DB via `ctx.db` in tRPC procedures, or `ctx.repo` for
higher-level helpers.

### Table & Relations

```typescript
export const TTableName = sqliteTable('table_name', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  webhookId: text('webhook_id').notNull()
    .references(() => TWebhooks.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const RTableName = relations(TTableName, ({ one }) => ({
  webhook: one(TWebhooks, { fields: [TTableName.webhookId], references: [TWebhooks.id] }),
}))
```

### Queries

```typescript
// CRUD
await ctx.db.select().from(TTable).where(eq(TTable.webhookId, id)).orderBy(desc(TTable.createdAt))
await ctx.db.insert(TTable).values({ ... }).returning()
await ctx.db.update(TTable).set({ ... }).where(eq(TTable.id, id)).returning()
await ctx.db.delete(TTable).where(eq(TTable.id, id)).returning()

// Single row
await ctx.db.delete(TTable).where(eq(TTable.id, id)).returning().get()
```

---

## tRPC (Backend)

### Route Template

```typescript
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { TTable } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const router = createTRPCRouter({
  list: baseProcedure
    .input(z.object({ webhookId: z.uuidv7() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.select().from(TTable).where(eq(TTable.webhookId, input.webhookId))
    }),

  create: baseProcedure
    .input(z.object({ webhookId: z.uuidv7() }))
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db.insert(TTable).values({ webhookId: input.webhookId }).returning()
      if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      return result
    }),
})
```

### Conventions

- Always validate input with Zod
- Skip try/catch — keep routes simple
- Throw `TRPCError` for not-found / internal errors
- Use `ctx.repo` for complex queries already implemented in
  `server/utils/repo.ts`

---

## tRPC (Frontend)

```typescript
const { $trpc } = useNuxtApp()
```

**Always wrap tRPC calls in `useAsyncData`** — for both queries and mutations.

### Queries

```typescript
const { data, refresh, status } = await useAsyncData('key',
  () => $trpc.webhook.list.query({ webhookId }))

// With dynamic params — include params in cache key
const { data } = await useAsyncData(`requests-${webhookId}`,
  () => $trpc.webhook.list.query({ webhookId }))
```

### Mutations

```typescript
const { execute: doDelete, status } = await useAsyncData(null,
  () => $trpc.webhook.delete.mutate({ requestId, webhookId }),
  { immediate: false }
)

const handleDelete = async () => {
  await doDelete()
  await refresh()
}
```

---

## Frontend Components

### Data Flow

**Fetch at page level, pass down via props, emit events up.** Child components
must not call the API.

```vue
<script setup lang="ts">
const { $trpc } = useNuxtApp()
const { data, refresh } = await useAsyncData('webhooks',
  () => $trpc.webhook.list.query({ webhookId }))
</script>

<template>
  <ListItemRequest
    v-for="i in data"
    :key="i.id"
    :request="i"
    @delete="async () => { await $trpc.webhook.delete.mutate({ ... }); refresh() }"
  />
</template>
```

### Form Components

- Zod schema at the top, export `FormXxxData` type
- Props: `defaultValue?`, `loading?`
- Watch `defaultValue` to sync state
- Emit `submit: [e: Schema]`, use `@submit.prevent`

```vue
<script setup lang="ts">
import * as z from 'zod'

const schema = z.object({ name: z.string().min(1) })
type Schema = z.output<typeof schema>
export type FormWebhookData = Schema

const props = withDefaults(defineProps<{
  defaultValue?: Partial<Schema>
  loading?: boolean
}>(), { defaultValue: () => ({}), loading: false })

const state = reactive<Partial<Schema>>(props.defaultValue)
watch(() => props.defaultValue, (v) => v && Object.assign(state, v))

const emits = defineEmits<{ submit: [e: Schema] }>()
</script>

<template>
  <UForm :schema="schema" :state="state" @submit.prevent="(e) => emits('submit', e.data)">
    <UFormField name="name" label="Name">
      <UInput v-model="state.name" class="w-full" />
    </UFormField>
    <UButton type="submit" label="Save" />
  </UForm>
</template>
```

---

## UI & Theming

### Semantic Colors

| Token     | Use               |
| --------- | ----------------- |
| primary   | CTAs, brand       |
| secondary | Alt actions       |
| success   | Confirmations     |
| info      | Neutral alerts    |
| warning   | Attention         |
| error     | Destructive       |
| neutral   | Backgrounds, text |

```vue
<UButton color="error">Delete</UButton>
<UButton color="success">Save</UButton>
```

---

## Testing

Tests live in `tests/nuxt/` and use `@nuxt/test-utils` with vitest. They spin up
a real dev server — no mocking.

### Setup

```typescript
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { beforeAll, describe, expect, it } from 'vitest'
import type { AppRouter } from '../../server/trpc'

const PORT = Math.floor(Math.random() * (3999 - 3100 + 1)) + 3100

describe('my feature', async () => {
  await setup({ dev: true, port: PORT })

  const trpc = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `http://localhost:${PORT}/api/trpc` })],
  })
})
```

### Pattern: create via tRPC, assert via HTTP

```typescript
it('returns configured status', async () => {
  const { id } = await trpc.webhook.create.mutate()
  await trpc.webhook.update.mutate({ webhookId: id, responseStatus: 201 })
  const result = await fetch(`/api/h/${id}`)
  expect(result.status).toBe(201)
})
```

### Pattern: shared fixture

```typescript
describe('default config', () => {
  let id: string
  beforeAll(async () => { ({ id } = await trpc.webhook.create.mutate()) })

  it('returns 200', async () => {
    expect((await fetch(`/api/h/${id}`)).status).toBe(200)
  })
})
```

### Pattern: parametrised cases

```typescript
it.each(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const)(
  'accepts %s',
  async (method) => {
    expect((await fetch(`/api/h/${id}`, { method })).status).toBe(200)
  },
)
```

### Notes

- Always use a random port per test file to avoid conflicts
- `[DB] Error inserting request` in test output is expected — Wrangler binding
  proxy fails in test env but doesn't affect test results

---

## Links

- [Nuxt](https://nuxt.com/docs) · [Nuxt UI](https://ui.nuxt.com/getting-started)
- [tRPC](https://trpc.io/docs) · [tRPC-Nuxt](https://trpc-nuxt.pages.dev/setup/)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) · [Cloudflare
  D1](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/)
