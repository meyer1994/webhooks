import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { TExecutions } from '../db/schema'
import { baseProcedure, createTRPCRouter } from '../utils/trpc'

export const router = createTRPCRouter({
  list: baseProcedure
    .query(async ({ ctx }) => {
      const executions = await ctx.db
        .select()
        .from(TExecutions)
        .orderBy(desc(TExecutions.createdAt))

      return executions
    }),

  start: baseProcedure
    .input(z.object({ nodeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [execution] = await ctx.db
        .insert(TExecutions)
        .values({
          nodeId: input.nodeId,
          status: 'PENDING',
          input: {},
        })
        .returning()

      if (!execution) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create execution',
        })
      }

      const run = async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5 * 1000))
      }

      run()
        .then(async () => {
          await ctx.db
            .update(TExecutions)
            .set({ status: 'FINISHED' })
            .where(eq(TExecutions.id, execution.id))
            .returning()
        })
        .catch(async () => {
          await ctx.db
            .update(TExecutions)
            .set({ status: 'FAILED' })
            .where(eq(TExecutions.id, execution.id))
            .returning()
        })

      return { executionId: execution.id }
    }),

  get: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const execution = await ctx.db.query.TExecutions.findFirst({
        where: eq(TExecutions.id, input.id),
        with: { node: true },
      })

      if (!execution) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution ${input.id} not found`,
        })
      }

      return execution
    }),

  cancel: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [result] = await ctx.db
        .update(TExecutions)
        .set({ status: 'CANCELLED' })
        .where(eq(TExecutions.id, input.id))
        .returning()

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution ${input.id} not found`,
        })
      }

      return result
    }),
})
