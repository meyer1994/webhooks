import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import z from 'zod'
import { TWebhooks } from '~~/server/db/schema'

const schema = z.object({
  id: z.uuidv7(),
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, e => schema.parse(e))
  const db = event.context.db

  // 1. Get Config
  const config = await db
    .select()
    .from(TWebhooks)
    .where(eq(TWebhooks.id, params.id))
    .get()

  if (!config) throw createError({ statusCode: 404, message: 'Webhook not found' })

  const id = uuidv7()
  const url = getRequestURL(event).href
  const headers = getRequestHeaders(event) as Record<string, string>
  const ipAddress = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || undefined
  const queryParams = getQuery(event) as Record<string, string>
  const body = await readRawBody(event, 'utf8')

  event.waitUntil(
    (async (): Promise<void> => {
      try {
        console.log('[DB] Inserting request:', id)
        await event.context.repo.append(params.id, {
          method: event.method,
          url,
          headers,
          queryParams,
          body,
          ipAddress,
          cfProperties: event.context.cf,
        })
      }
      catch (error) {
        console.error(`[DB] Error inserting request: ${id}`, error)
        throw error
      }
    })(),
  )

  const delay = Math.max(config.responseDelay ?? 0, 0)
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))

  setResponseStatus(event, config.responseStatus || 200)
  setResponseHeader(event, 'Content-Type', config.responseContentType || 'application/json')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')

  return config.responseBody || '{"status":"ok"}'
})
