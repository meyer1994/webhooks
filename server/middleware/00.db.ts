import type { Logger } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

let db: DrizzleD1Database<typeof schema> | null = null

export default defineEventHandler(async (event) => {
  let logger: Logger | undefined

  if (import.meta.dev) {
    logger = {
      logQuery: (query: string, params: unknown[]) => {
        console.debug('[DB] Query:', { query, params })
      },
    }
  }

  if (!db) {
    db = drizzle(event.context.cloudflare.env.DB, { schema, logger })
    console.info('[Middleware] DB initialized')
  }
  event.context.db = db
})
