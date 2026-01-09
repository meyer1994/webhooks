import * as z from 'zod'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const filesRouter = createTRPCRouter({
  create: baseProcedure
    .input(z
      .instanceof(FormData)
      .transform(fd => Object.fromEntries(fd.entries()))
      .pipe(
        z.object({
          file: z.instanceof(File)
            .refine(f => f.size > 0)
            .refine(f => f.size <= 10 * 1024 * 1024) // 10MB
            .refine(f => f.type.startsWith('image/'))
            .refine(f => f.name.trim().length > 0),
        })))
    .mutation(async ({ input, ctx }) => {
      await ctx.storage.set(input.file.name, input.file.stream())
    }),

  delete: baseProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.storage.del(input.key)
    }),

  list: baseProcedure
    .query(async ({ ctx }) => {
      const keys: string[] = await ctx.storage.list()
      return await Promise.all(keys.map(async key => ({
        key,
        url: await ctx.storage.presign(key),
      })))
    }),
})
