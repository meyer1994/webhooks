import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

let db: DrizzleD1Database<typeof schema> | null = null

export default defineEventHandler(async (event) => {
  if (!db) db = drizzle(event.context.cloudflare.env.DB, { schema })
  event.context.db = db
})
