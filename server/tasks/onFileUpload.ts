import type { TRPCContext } from '~~/server/utils/trpc'

export const onFileUpload = async (key: string, ctx: TRPCContext) => {
  try {
    // We now use the unified set method which handles fetching from storage,
    // extraction (assuming text), and embedding.
    await ctx.vector.set(key, {
      type: 'txt', // Assuming txt as requested
    })

    console.info(`[Vectorize] Successfully indexed: ${key}`)
  }
  catch (error) {
    console.error(`[Vectorize] Failed to index ${key}:`, error)
    throw error
  }
}
