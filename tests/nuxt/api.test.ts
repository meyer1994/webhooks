import { fetch, setup } from '@nuxt/test-utils/e2e'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { uuidv7 } from 'uuidv7'
import { describe, expect, it } from 'vitest'
import type { AppRouter } from '../../server/trpc'

const MAX_PORT = 3100
const MIN_PORT = 3999
const PORT = Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT

describe('http: /api/h/[id]', async () => {
  await setup({ dev: true, port: PORT })

  const trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({ url: `http://localhost:${PORT}/api/trpc` }),
    ],
  })

  it('returns 400 on invalid id', async () => {
    const result = await fetch('/api/h/invalid')
    expect(result.status).toBe(400)
  })

  it('returns 404 on non-existent webhook', async () => {
    const id = uuidv7()
    const result = await fetch(`/api/h/${id}`)
    expect(result.status).toBe(404)
  })

  it('returns 200 on valid webhook', async () => {
    const result = await trpc.webhook.create.mutate()
    // example:
    //
    // {
    //   id: '019e3dc7-7b34-7cd0-a1fe-ff21eadfe193',
    //   name: null,
    //   allowCors: false,
    //   responseStatus: 200,
    //   responseContentType: 'application/json',
    //   responseBody: '{"status":"ok"}',
    //   responseDelay: 0,
    //   createdAt: null,
    //   updatedAt: null
    // }

    expect(result).toMatchObject({
      id: expect.any(String),
      name: null,
      allowCors: false,
      responseStatus: 200,
      responseContentType: 'application/json',
      responseBody: '{"status":"ok"}',
      responseDelay: 0,
      createdAt: null,
      updatedAt: null,
    })
  })
})
