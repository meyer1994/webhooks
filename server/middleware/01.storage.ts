import { R2Storage } from '../utils/storage'

export default defineEventHandler(async (event) => {
  if (!event.context.cloudflare?.env?.BUCKET) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare R2 BUCKET binding not found',
    })
  }

  const config = useRuntimeConfig(event)

  if (!config.aws.bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Runtime config AWS_BUCKET not found',
    })
  }

  event.context.storage = new R2Storage(
    event.context.cloudflare.env.BUCKET,
    config.aws.bucket,
  )

  console.info('[Middleware] R2 Storage initialized (with S3 presign support)')
})
