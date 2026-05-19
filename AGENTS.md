# Bruch Project Agent Guide

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

## Commands

- `pnpm dev` / `pnpm build` / `pnpm typecheck` / `pnpm lint(:fix)`
- `pnpm db:generate` / `pnpm db:migrate`
- `pnpm test` — run all tests (vitest, verbose, no watch)
- `pnpm test -- --reporter dot` — quieter output

---

## Database (Drizzle)

Always use `useDrizzle()`:

```typescript
import { useDrizzle } from '@@/server/utils/drizzle'
const db = useDrizzle()
```

### Table & Relations

```typescript
export const TTableName = sqliteTable('table_name', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull()
    .references(() => TUser.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
})

export const RTableName = relations(TTableName, ({ one, many }) => ({
  user: one(TUser, { fields: [TTableName.userId], references: [TUser.id] }),
  children: many(TChildTable),
}))
```

### Queries

```typescript
// CRUD
await db.select().from(TProcesses).where(eq(TProcesses.userId, userId)).orderBy(desc(TProcesses.createdAt))
await db.insert(TProcesses).values({ ... }).returning()
await db.update(TProcesses).set({ ... }).where(eq(TProcesses.id, id)).returning()
await db.delete(TProcesses).where(eq(TProcesses.id, id)).returning()

// With relations
await db.query.TProcesses.findMany({ with: { files: true }, where: eq(...) })
await db.query.TProcesses.findFirst({ with: { files: true }, where: eq(...) })

// Joins, JSONB
.leftJoin(TFiles, eq(TFiles.processId, TProcesses.id))
.where(sql`${TFiles.metadata}->>'filename' ILIKE ${'%' + term + '%'}`)
```

---

## tRPC (Backend)

### Route Template

```typescript
import { z } from 'zod'
import { TTable } from '../db/schema'
import { useDrizzle } from '../utils/drizzle'
import { baseProcedure, createTRPCRouter } from '../utils/trpc'

export const router = createTRPCRouter({
  list: baseProcedure
    .input(z.object({ /* ... */ }))
    .query(async ({ input, ctx }) => {
      return await useDrizzle().select().from(TTable)
    }),

  create: baseProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ input }) => {
      const [result] = await useDrizzle().insert(TTable).values({...}).returning()
      if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      return result
    }),
})
```

### Procedures

- `baseProcedure` — base procedure, no auth required. Access `ctx.db` and
  `ctx.repo`.

### Conventions

- Always validate input with Zod
- Skip try/catch — keep routes simple
- Throw `TRPCError` for not-found / internal errors

---

## tRPC (Frontend)

```typescript
const { $trpc } = useNuxtApp()
```

**Always wrap tRPC calls in `useAsyncData`** — for both queries and mutations.
Provides SSR, caching, and consistent state handling.

### Queries

```typescript
// Basic query
const { data, refresh, status } = await useAsyncData('processes',
  () => $trpc.process.list.query())

// With params (include in cache key)
const processId = 'uuid-here'
const { data: files } = await useAsyncData(`files-${processId}`,
  () => $trpc.files.list.query({ processId }))

// Parallel queries
const [{ data: files, refresh: refreshFiles },
       { data: notes, refresh: refreshNotes }] = [
  await useAsyncData('files', () => $trpc.files.list.query({ processId })),
  await useAsyncData('notes', () => $trpc.notes.list.query({ processId })),
]
```

### Mutations

```typescript
// Deferred mutation (immediate: false)
const { execute: deleteProcess, status } = await useAsyncData(null,
  () => $trpc.process.delete.mutate({ id }),
  { immediate: false }
)

const handleDelete = async () => {
  await deleteProcess()
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
const { data, refresh } = await useAsyncData('users',
  () => $trpc.users.list.query())
</script>

<template>
  <TableAdminUsers
    :items="data || []"
    @delete="async (id) => { await $trpc.users.delete.mutate({ id }); refresh() }"
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
import * as z from "zod"

const schema = z.object({ name: z.string().min(1), email: z.string().email() })
type Schema = z.output<typeof schema>
export type FormUserData = Schema

const props = withDefaults(defineProps<{
  defaultValue?: Partial<Schema>
  loading?: boolean
}>(), { defaultValue: () => ({}), loading: false })

const state = reactive<Partial<Schema>>(props.defaultValue)
watch(() => props.defaultValue, (v) => v && Object.assign(state, v))

const emits = defineEmits<{ submit: [e: Schema] }>()
</script>

<template>
  <UForm :schema="schema" :state="state"
    @submit.prevent="(e) => emits('submit', e.data)">
    <UFormField name="name" label="Name">
      <UInput v-model="state.name" class="w-full" />
    </UFormField>
    <UButton type="submit" label="Submit" />
  </UForm>
</template>
```

### Table Components

- Type items via `AppRouterOutputs["..."]["..."][number]`
- Props: `items`, `filter?`, `loading?`
- Emit: `select-item`, `delete-item`, `update-item`, `refresh-table`
- Use `id: 'id' as const` per column; build `MAP_ID_TO_LABEL` from columns
- Use `v-model:column-visibility` and `useTemplateRef('table')`
- Use `#columnId-cell` slots for custom content

```vue
<script setup lang="ts">
import type { AppRouterOutputs } from "@@/server/trpc"
import type { TableColumn } from "@nuxt/ui"

type Item = AppRouterOutputs["node"]["list"][number]
type Keys = keyof Item | "actions"

const props = defineProps<{ items: Item[]; filter?: string; loading?: boolean }>()
const emit = defineEmits<{
  "select-item": [item: Item]
  "delete-item": [item: Item]
  "update-item": [item: Item]
  "refresh-table": []
}>()

const columns: TableColumn<Item>[] = [
  { id: "id" as const, accessorKey: "id", header: "ID" },
  { id: "actions" as const, header: "Actions" },
]

const MAP_ID_TO_LABEL: Record<Keys, string> = columns.reduce(
  (a, c) => ({ ...a, [c.id as Keys]: c.header }), {} as Record<Keys, string>
)

const visible: Ref<Record<Keys, boolean>> = ref({ id: true, actions: true })
const table = useTemplateRef("table")
</script>
```

---

## UI & Theming

### Semantic Colors

| Token     | Default | Use               |
| --------- | ------- | ----------------- |
| primary   | green   | CTAs, brand       |
| secondary | blue    | Alt actions       |
| success   | green   | Confirmations     |
| info      | blue    | Neutral alerts    |
| warning   | yellow  | Attention         |
| error     | red     | Destructive       |
| neutral   | slate   | Backgrounds, text |

```vue
<UButton color="success">Save</UButton>
```

### Configuration

```css
/* main.css */
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: 'Public Sans', system-ui, sans-serif;
}

@theme static {
  --color-brand-500: #ef4444; /* define shades 50-950 */
}
```

```typescript
// app.config.ts
export default defineAppConfig({
  ui: { colors: { primary: 'brand', secondary: 'blue', neutral: 'zinc' } }
})
```

---

## Testing

Tests live in `tests/nuxt/` and use `@nuxt/test-utils` with vitest. They spin up
a real dev server and hit it over HTTP — no mocking.

### Setup

```typescript
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { beforeAll, describe, expect, it } from 'vitest'
import type { AppRouter } from '../../server/trpc'

const PORT = Math.floor(Math.random() * (3999 - 3100 + 1)) + 3100

describe('http: /api/h/[id]', async () => {
  await setup({ dev: true, port: PORT })

  const trpc = createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: `http://localhost:${PORT}/api/trpc` })],
  })
})
```

### Pattern: create via tRPC, assert via HTTP fetch

```typescript
it('returns configured status', async () => {
  const { id } = await trpc.webhook.create.mutate()
  await trpc.webhook.update.mutate({ webhookId: id, responseStatus: 201 })
  const result = await fetch(`/api/h/${id}`)
  expect(result.status).toBe(201)
})
```

### Pattern: shared fixture with beforeAll

```typescript
describe('default webhook config', () => {
  let id: string

  beforeAll(async () => {
    const webhook = await trpc.webhook.create.mutate()
    id = webhook.id
  })

  it('returns 200', async () => {
    const result = await fetch(`/api/h/${id}`)
    expect(result.status).toBe(200)
  })
})
```

### Pattern: parametrised cases

```typescript
it.each(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const)(
  'accepts %s requests',
  async (method) => {
    const result = await fetch(`/api/h/${id}`, { method })
    expect(result.status).toBe(200)
  },
)
```

### Notes

- `event.context.repo` is set by `server/middleware/context.ts` — it must be
  available for DB writes inside `event.waitUntil`. The Wrangler/Miniflare
  binding proxy fails in the test environment (logged as `[DB] Error inserting
  request`), but this doesn't fail tests since the response is already sent.
- Always use a random port per test file to avoid conflicts when running in
  parallel.

---

## Links

- [Nuxt](https://nuxt.com/docs) · [Nuxt UI](https://ui.nuxt.com/getting-started)
- [tRPC](https://trpc.io/docs) · [tRPC-Nuxt](https://trpc-nuxt.pages.dev/setup/)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) · [Cloudflare
  D1](https://developers.cloudflare.com/d1/)