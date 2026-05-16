import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import * as z from 'zod'
import { TRequests } from '~~/server/db/schema'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const webhookRouter = createTRPCRouter({
  create: baseProcedure.mutation(async ({ ctx }) => {
    const config = await ctx.repo.create({
      responseStatus: 200,
      responseContentType: 'application/json',
      responseBody: '{"status":"ok"}',
      responseDelay: 0,
    })

    if (!config)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create webhook',
      })

    return config
  }),

  config: baseProcedure
    .input(z.object({
      webhookId: z.uuidv7(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.repo.config(input.webhookId)
    }),

  list: baseProcedure
    .input(z.object({
      webhookId: z.uuidv7(),
      limit: z.number().min(1).max(100).default(100),
      filter: z.string().optional(),
    }))
    .query(async ({ ctx, input: { webhookId, limit, filter } }) => {
      return await ctx.repo.list(webhookId, { limit, filter })
    }),

  get: baseProcedure
    .input(z.object({
      requestId: z.uuidv7(),
      webhookId: z.uuidv7(),
    }))
    .query(async ({ ctx, input: { requestId, webhookId } }) => {
      return await ctx.repo.request(webhookId, requestId)
    }),

  update: baseProcedure
    .input(
      z.object({
        webhookId: z.uuidv7(),
        name: z.string().max(255).optional(),
        allowCors: z.boolean().optional(),
        responseStatus: z.number().min(100).max(599).optional(),
        responseContentType: z
          .enum(['application/json', 'text/plain', 'text/html', 'application/xml'])
          .optional(),
        responseBody: z.string().max(1024 * 1024 * 1).optional(),
        responseDelay: z.number().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.repo.update(input.webhookId, input)
    }),

  clear: baseProcedure
    .input(z.object({
      webhookId: z.uuidv7(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(TRequests)
        .where(eq(TRequests.webhookId, input.webhookId))
      return true
    }),

  delete: baseProcedure
    .input(z.object({
      requestId: z.uuidv7(),
      webhookId: z.uuidv7(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db
        .delete(TRequests)
        .where(
          and(
            eq(TRequests.id, input.requestId),
            eq(TRequests.webhookId, input.webhookId)))
        .returning()
        .get()

      if (!request)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Request not found',
        })

      return request
    }),
})
