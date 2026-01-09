import { desc, eq } from 'drizzle-orm'
import * as z from 'zod'
import { TUsers } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const usersRouter = createTRPCRouter({
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
})
