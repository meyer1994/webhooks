import type * as schema from '#server/db/schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

declare module 'h3' {
  interface H3EventContext {
    cf: CfProperties

    cloudflare: {
      request: Request
      env: Env
      context: ExecutionContext
    }

    db: DrizzleD1Database<typeof schema>
  }
}

export { }
