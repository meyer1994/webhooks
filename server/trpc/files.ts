import * as z from 'zod'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'
import { onFileUpload } from '../tasks/onFileUpload'

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
            .refine(f => f.type === 'text/plain' || f.type === 'text/markdown')
            .refine(f => f.name.trim().length > 0),
        })))
    .mutation(async ({ input, ctx }) => {
      await ctx.storage.set(input.file.name, input.file.stream())
      ctx.event.waitUntil(onFileUpload(input.file.name, ctx))
    }),

  delete: baseProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await Promise.all([
        ctx.storage.del(input.key),
        ctx.vector.del(input.key),
      ])
    }),

  list: baseProcedure
    .query(async ({ ctx }) => {
      const items = await ctx.storage.list()
      return await Promise.all(items.map(async item => ({
        ...item,
        url: await ctx.storage.presign(item.key),
      })))
    }),
})
