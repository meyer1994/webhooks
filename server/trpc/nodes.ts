import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { TNodes } from '~~/server/db/schema'

export const router = createTRPCRouter({
  create: baseProcedure
    .input(z.object({
      data: z.record(z.string(), z.any()),
      parentId: z.string().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .insert(TNodes)
        .values({
          data: input.data,
          parentId: input.parentId,
        })
        .returning()
      return result
    }),

  list: baseProcedure
    .query(async ({ ctx }) => {
      const nodes = await ctx.db
        .select()
        .from(TNodes)
        .orderBy(desc(TNodes.createdAt))

      return nodes
    }),

  get: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const node = await ctx.db.query.TNodes.findFirst({
        where: eq(TNodes.id, input.id),
      })

      if (!node) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Node ${input.id} not found`,
        })
      }

      return node
    }),

  update: baseProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.any(),
        parentId: z.string().nullable(),
      }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .update(TNodes)
        .set({ ...input, id: undefined })
        .where(eq(TNodes.id, input.id))
        .returning()
      return result
    }),

  delete: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .delete(TNodes)
        .where(eq(TNodes.id, input.id))
        .returning()

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Node ${input.id} not found`,
        })
      }

      return result
    }),

  tree: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const traverse = async (id: string): Promise<unknown> => {
        const node = await ctx.db.query.TNodes.findFirst({
          where: eq(TNodes.id, id),
        })

        if (!node) return null

        const children = await ctx.db
          .select()
          .from(TNodes)
          .where(eq(TNodes.parentId, id))

        const promises = children.map(child => traverse(child.id))
        const trees = await Promise.all(promises)
        return { ...node, children: trees.filter(Boolean) }
      }

      return await traverse(input.id)
    }),
})
