import type * as schema from '#server/db/schema'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { FileStorage } from '../server/utils/storage'
import type { VectorStorage } from '../server/utils/vector'

declare module 'h3' {
  interface H3EventContext {
    cf: CfProperties

    cloudflare: {
      request: Request
      env: Env
      context: ExecutionContext
    }

    storage: FileStorage
    db: DrizzleD1Database<typeof schema>
    vector: VectorStorage
  }
}

export { }
