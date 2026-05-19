import { initTRPC } from '@trpc/server'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import type * as schema from '../db/schema'
import { WebhookRepo } from './repo'

export type TRPCContext = {
  event: H3Event
  db: DrizzleD1Database<typeof schema>
  repo: WebhookRepo
}

export const createTRPCContext = async (event: H3Event) => {
  /**
  * @see: https://trpc.io/docs/server/context
  */
  return {
    event,
    db: event.context.db,
    repo: new WebhookRepo(event.context.db),
  } satisfies TRPCContext
}

// Avoid exporting the entire t-object since it's not very descriptive. For
// instance, the use of a t variable is common in i18n libraries.
const t = initTRPC.context<TRPCContext>().create({
  /**
  * @see https://trpc.io/docs/server/data-transformers
  */
  // transformer: superjson,
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const baseProcedure = t.procedure
