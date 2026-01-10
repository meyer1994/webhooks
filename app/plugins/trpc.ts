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

/**
 * tRPC Nuxt Plugin
 *
 * This plugin initializes the tRPC client for both server and client
 * environments. It uses a "polymorphic" approach to resolve SSR hydration
 * issues on Cloudflare Workers:
 *
 * 1. On Server (SSR): It bypasses HTTP subrequests (loopback) by using an
 *    internal caller. This ensures that Cloudflare context bindings (D1, R2,
 *    etc.) are preserved and that we don't hit Cloudflare's loopback
 *    restrictions.
 * 2. On Client: It uses standard HTTP/Batch links to communicate with the API.
 *
 * Both environments share the same AppRouter type for full TypeScript
 * transparency.
 */
export default defineNuxtPlugin(async () => {
  const links: TRPCLink<AppRouter>[] = []

  if (import.meta.server) {
    const event = useRequestEvent()
    if (!event) throw new Error('No event found')

    const { appRouter } = await import('~~/server/trpc')
    const { createInternalCaller } = await import('~~/server/utils/trpc')

    const caller = await createInternalCaller(appRouter, event!)

    // Internal link to bypass HTTP during SSR. This transforms tRPC calls into
    // direct function calls against the router, ensuring we stay within the
    // same execution context as the Nitro event
    links.push(() => ({ op }) => observable((observer) => {
      const parts = op.path.split('.')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let procedure = caller as any
      for (const part of parts) procedure = procedure[part]

      procedure(op.input)
        .then((data: unknown) => {
          observer.next({ result: { data } })
          observer.complete()
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any) => observer.error(err))
    }))
  }

  if (import.meta.browser) {
    // Client-side initialization using standard HTTP transport. We use
    // splitLink to handle both standard JSON and non-serializable data (like
    // Files).
    links.push(loggerLink())

    links.push(splitLink({
      condition: op => isNonJsonSerializable(op.input),
      true: httpLink({ url: '/api/trpc' }),
      false: httpBatchLink({ url: '/api/trpc' }),
    }))
  }

  const trpc = createTRPCNuxtClient({ links })
  return { provide: { trpc } }
})
