import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { TUsers } from '../db/schema'
import { baseProcedure, createTRPCRouter } from '../utils/trpc'

export const appRouter = createTRPCRouter({
  ping: baseProcedure
    .query(() => 'pong'),

  health: baseProcedure
    .query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })),

  users: createTRPCRouter({
    create: baseProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const [user] = await ctx.db
          .insert(TUsers)
          .values({ name: input.name })
          .returning()
        return user
      }),

    delete: baseProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.db.delete(TUsers).where(eq(TUsers.id, input.id))
        return { success: true }
      }),

    update: baseProcedure
      .input(z.object({ id: z.string(), name: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const [user] = await ctx.db
          .update(TUsers)
          .set({ name: input.name })
          .where(eq(TUsers.id, input.id))
          .returning()
        return user
      }),

    list: baseProcedure
      .query(async ({ ctx }) => {
        return await ctx.db
          .select()
          .from(TUsers)
          .orderBy(desc(TUsers.createdAt))
      }),
  }),

  files: createTRPCRouter({
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
        return await ctx.storage.list()
      }),
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
export type AppRouterInputs = inferRouterInputs<AppRouter>
export type AppRouterOutputs = inferRouterOutputs<AppRouter>
