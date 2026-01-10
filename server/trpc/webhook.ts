import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { uuidv7 } from 'uuidv7'
import * as z from 'zod'
import { TWebhooks } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const webhookRouter = createTRPCRouter({
  create: baseProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.db
      .insert(TWebhooks)
      .values({ id: uuidv7(), createdAt: new Date() })
      .returning()
      .get()

    if (!config)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create webhook',
      })

    return config
  }),

  list: baseProcedure
    .input(z.object({
      webhookId: z.uuidv7(),
      limit: z.number().min(1).max(100).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db.query.TWebhooks.findFirst({
        where: eq(TWebhooks.id, input.webhookId),
        with: {
          requests: {
            orderBy: (t, s) => [s.desc(t.id), s.desc(t.createdAt)],
            limit: input.limit,
          },
        },
      })

      if (!config)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook not found',
        })

      return {
        ...config,
        requests: config.requests.map((request) => {
          return {
            ...request,
            headers: JSON.parse(request.headers || '{}') as Record<string, string>,
            queryParams: JSON.parse(request.queryParams || '{}') as Record<string, string>,
            cfProperties: JSON.parse(request.cfProperties || '{}') as Record<string, string>,
          }
        }),
      }
    }),

  get: baseProcedure
    .input(z.object({
      requestId: z.uuidv7(),
      webhookId: z.uuidv7(),
    }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.query.TRequests.findFirst({
        where: (t, s) =>
          s.and(
            s.eq(t.id, input.requestId),
            s.eq(t.webhookId, input.webhookId)),
      })

      if (!request)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })

      return {
        ...request,
        headers: JSON.parse(request.headers || '{}') as Record<string, string>,
        queryParams: JSON.parse(request.queryParams || '{}') as Record<string, string>,
        cfProperties: JSON.parse(request.cfProperties || '{}') as Record<string, string>,
      }
    }),

  update: baseProcedure
    .input(
      z.object({
        webhookId: z.uuidv7(),
        responseStatus: z.number().min(100).max(599).optional(),
        responseContentType: z.string().max(1024).optional(),
        responseBody: z.string().max(1024 * 1024 * 1).optional(),
        responseDelay: z.number().min(0).max(100).optional(),
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
