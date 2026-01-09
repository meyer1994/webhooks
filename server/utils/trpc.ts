import { initTRPC } from '@trpc/server'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import type * as schema from '../db/schema'

export const createTRPCContext = async (event: H3Event) => {
  /**
  * @see: https://trpc.io/docs/server/context
  */
  type Context = {
    db: DrizzleD1Database<typeof schema>
    storage: IStorage
    event: H3Event
  }
  return { event, db: event.context.db, storage: event.context.storage } satisfies Context
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

// Avoid exporting the entire t-object since it's not very descriptive. For
// instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
  * @see https://trpc.io/docs/server/data-transformers
  */
  // transformer: superjson,
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
