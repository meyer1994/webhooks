import type { Logger } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'
import { WebhookRepo } from '../utils/repo'

const logger: Logger = {
  logQuery: (query, params) => {
    if (!import.meta.dev || !import.meta.test) return
    console.debug('[drizzle] Query:', { query, params })
  },
}

/**
 * We attach the database instance to the actual nuxt H3Event context
 *
 * Why? Because it automatically includes the db for everything downstream and
 * we override the type to include the database to the context.
 */
export default defineEventHandler(async (event) => {
  console.info('[middleware.context] Started context creation...')
  event.context.db = drizzle(event.context.cloudflare.env.DB, { schema, logger })
  event.context.repo = new WebhookRepo(event.context.db)
  console.info('[middleware.context] Finished context creation...')
})

declare module 'h3' {
  interface H3EventContext {
    cf: CfProperties

    cloudflare: {
      env: Env
      request: Request
      context: ExecutionContext
    }

    db: DrizzleD1Database<typeof schema>
    repo: WebhookRepo
  }
}
