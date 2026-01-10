import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import z from 'zod'
import { TRequests, TWebhooks } from '~~/server/db/schema'

const schema = z.object({
  id: z.uuidv7(),
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, e => schema.parse(e))
  const db = event.context.db
  console.log('params', params)

  // 1. Get Config
  const config = await db
    .select()
    .from(TWebhooks)
    .where(eq(TWebhooks.id, params.id))
    .get()

  if (!config) throw createError({ statusCode: 404, message: 'Webhook not found' })

  event.waitUntil(
    (async (): Promise<void> => {
      try {
        const id = uuidv7()
        console.log('[DB] Inserting request:', id)
        await db.insert(TRequests).values([{
          id,
          webhookId: params.id,
          method: event.method,
          url: getRequestURL(event).href,
          headers: JSON.stringify(getRequestHeaders(event)),
          queryParams: JSON.stringify(getQuery(event)),
          body: await readRawBody(event, 'utf8'),
          createdAt: new Date(),
        }])
      }
      catch (error) {
        console.error('[DB] Error inserting request:', error)
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
