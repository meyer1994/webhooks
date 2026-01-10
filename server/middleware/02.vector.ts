import { CloudflareVectorizeStorage } from '../utils/vector'

export default defineEventHandler(async (event) => {
  if (!event.context.storage)
    throw createError({ statusCode: 500, statusMessage: 'Storage not found' })

  const vector = new CloudflareVectorizeStorage(
    event.context.cloudflare.env,
    event.context.storage,
  )

  event.context.vector = vector
})
