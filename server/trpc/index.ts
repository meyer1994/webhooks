import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { webhookRouter } from '~~/server/trpc/webhook'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const appRouter = createTRPCRouter({
  ping: baseProcedure
    .query(() => 'pong'),

  health: baseProcedure
    .query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })),

  webhook: webhookRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
export type AppRouterInputs = inferRouterInputs<AppRouter>
export type AppRouterOutputs = inferRouterOutputs<AppRouter>
