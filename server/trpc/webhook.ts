import * as z from 'zod'
import { eq, and, gt, desc } from 'drizzle-orm'
import { TWebhooks, TRequests } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'
import { uuidv7 } from 'uuidv7'

export const webhookRouter = createTRPCRouter({
  create: baseProcedure.mutation(async ({ ctx }) => {
    const newId = uuidv7()
    await ctx.db.insert(TWebhooks).values({
      id: newId,
      createdAt: new Date(),
    })
    return { id: newId }
  }),

  init: baseProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db
        .select()
        .from(TWebhooks)
        .where(eq(TWebhooks.id, input.webhookId))
        .get()

      if (!config) {
        throw new Error('Webhook not found')
      }

      const history = await ctx.db
        .select()
        .from(TRequests)
        .where(eq(TRequests.webhookId, input.webhookId))
        .orderBy(desc(TRequests.id))
        .limit(20)

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
            gt(TRequests.id, input.lastId),
          ),
        )
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

      if (!request) {
        throw new Error('Request not found')
      }

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
