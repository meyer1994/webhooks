import {
  httpBatchLink,
  httpLink,
  isNonJsonSerializable,
  loggerLink,
  splitLink,
  type TRPCLink,
} from '@trpc/client'
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

  if (import.meta.server || import.meta.prerender) {
    const event = useRequestEvent()
    if (!event) throw new Error('No event found')

    const url = useRequestURL()
    const headers = useRequestHeaders()

    links.push(httpBatchLink({ url: new URL('/api/trpc', url.origin), headers }))
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
