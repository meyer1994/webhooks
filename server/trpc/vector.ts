import { z } from 'zod'
import { baseProcedure, createTRPCRouter } from '../utils/trpc'

export const vectorRouter = createTRPCRouter({
  search: baseProcedure
    .input(z.object({
      query: z.string().min(1),
      prefix: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      console.info(`[tRPC] Vector search: "${input.query}" (prefix: ${input.prefix ?? 'none'})`)
      return await ctx.vector.search(input.query, {
        prefix: input.prefix ?? undefined,
      })
    }),
})
