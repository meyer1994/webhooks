import {
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
  type TRPCLink,
} from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { createTRPCNuxtClient } from 'trpc-nuxt/client'
import type { AppRouter } from '~~/server/trpc'

export default defineNuxtPlugin(async () => {
  const links: TRPCLink<AppRouter>[] = []

  if (import.meta.server) {
    const event = useRequestEvent()
    const { appRouter } = await import('~~/server/trpc')
    const { createInternalCaller } = await import('~~/server/utils/trpc')

    const caller = await createInternalCaller(appRouter, event!)

    // Internal link to bypass HTTP during SSR
    links.push(() => ({ op }) => observable((observer) => {
      const { path, input } = op

      // Traverse the caller to find the procedure
      const parts = path.split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let procedure = caller as any
      for (const part of parts) {
        procedure = procedure[part]
      }

      // Execute the procedure directly
      procedure(input)
        .then((data: unknown) => {
          observer.next({ result: { data } })
          observer.complete()
        })
        .catch((err: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          observer.error(err as any)
        })
    }))
  }

  if (import.meta.browser) {
    links.push(loggerLink())

    links.push(splitLink({
      condition: op => isNonJsonSerializable(op.input),
      true: httpLink({ url: '/api/trpc' }),
      false: httpBatchLink({ url: '/api/trpc' }),
    }))
  }

  const trpc = createTRPCNuxtClient<AppRouter>({
    links,
  })

  if (import.meta.dev) {
    console.info(`[tRPC] ${import.meta.server ? 'Server' : 'Client'} client initialized`)
  }

  return {
    provide: {
      trpc,
    },
  }
})
