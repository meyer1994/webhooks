import { S3Storage } from '../utils/storage'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  event.context.storage = new S3Storage(config.aws.bucket)
})
