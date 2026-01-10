import { TRPCError } from '@trpc/server'
import { and, desc, eq, gt } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as z from 'zod'
import { TRequests, TWebhooks } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const webhookRouter = createTRPCRouter({
  create: baseProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db
      .insert(TWebhooks)
      .values({
        id: uuidv7(),
        createdAt: new Date(),
      })
      .returning()
      .get()

    if (!config)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create webhook',
      })

    return config
  }),

  init: baseProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db
        .select()
        .from(TWebhooks)
        .where(eq(TWebhooks.id, input.webhookId))
        .get()

      if (!config)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })

      const history = await ctx.db
        .select()
        .from(TRequests)
        .where(eq(TRequests.webhookId, input.webhookId))
        .orderBy(desc(TRequests.id))

      return { config, history }
    }),

  poll: baseProcedure
    .input(z.object({ webhookId: z.string(), lastId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(TRequests)
        .where(
          and(
            eq(TRequests.webhookId, input.webhookId),
            gt(TRequests.id, input.lastId)))
        .orderBy(desc(TRequests.id))
    }),

  get: baseProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db
        .select()
        .from(TRequests)
        .where(eq(TRequests.id, input.requestId))
        .get()

      if (!request)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })

      return request
    }),

  updateConfig: baseProcedure
    .input(
      z.object({
        webhookId: z.string(),
        responseStatus: z.number().optional(),
        responseContentType: z.string().optional(),
        responseBody: z.string().optional(),
        responseDelay: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { webhookId, ...updates } = input
      await ctx.db
        .update(TWebhooks)
        .set(updates)
        .where(eq(TWebhooks.id, webhookId))
      return true
    }),
})
