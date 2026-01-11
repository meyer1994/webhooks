import type { Logger } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'
import { WebhookRepo } from '../utils/repo'

export default defineEventHandler(async (event) => {
  let logger: Logger | undefined

  if (import.meta.dev) {
    logger = {
      logQuery: (query: string, params: unknown[]) => {
        if (process.env.NODE_ENV === 'production') return
        console.debug('[DB] Query:', { query, params })
      },
    }
  }

  event.context.db = drizzle(event.context.cloudflare.env.DB, { schema, logger })
  console.info('[Middleware] DB initialized')

  event.context.repo = new WebhookRepo(event.context.db)
  console.info('[Middleware] Repo initialized')
})
