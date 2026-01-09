import type { AppRouter } from '@@/server/trpc'
import { isNonJsonSerializable, loggerLink, splitLink } from '@trpc/client'
import { createTRPCNuxtClient, httpBatchLink, httpLink } from 'trpc-nuxt/client'

export default defineNuxtPlugin(() => {
  const links = []

  if (import.meta.browser) {
    links.push(loggerLink())
  }

  links.push(splitLink({
    condition: op => isNonJsonSerializable(op.input),
    true: httpLink({ url: '/api/trpc' }),
    false: httpBatchLink({ url: '/api/trpc' }),
  }))

  const trpc = createTRPCNuxtClient<AppRouter>({
    links,
  })

  return { provide: { trpc } }
})
