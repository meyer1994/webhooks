import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { filesRouter } from '~~/server/trpc/files'
import { usersRouter } from '~~/server/trpc/users'
import { baseProcedure, createTRPCRouter } from '~~/server/utils/trpc'

export const appRouter = createTRPCRouter({
  ping: baseProcedure
    .query(() => 'pong'),

  health: baseProcedure
    .query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })),

  users: usersRouter,
  files: filesRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
export type AppRouterInputs = inferRouterInputs<AppRouter>
export type AppRouterOutputs = inferRouterOutputs<AppRouter>
