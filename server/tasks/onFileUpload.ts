import type { TRPCContext } from '~~/server/utils/trpc'

export const onFileUpload = async (key: string, ctx: TRPCContext) => {
  try {
    console.info(`[Task] Processing file upload: ${key}`)
    // We now use the unified set method which handles fetching from storage,
    // extraction (assuming text), and embedding.
    const metadata = await ctx.storage.metadata(key)
    await ctx.vector.set(key, { ...metadata })

    console.info(`[Task] Successfully indexed: ${key}`)
  }
  catch (error) {
    console.error(`[Task] Failed to index ${key}:`, error)
    throw error
  }
}
