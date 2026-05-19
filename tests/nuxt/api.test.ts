import { fetch, setup } from '@nuxt/test-utils/e2e'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { uuidv7 } from 'uuidv7'
import { beforeAll, describe, expect, it } from 'vitest'
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

  // ── ID validation ──────────────────────────────────────────────────────────

  it('returns 400 on invalid id', async () => {
    const result = await fetch('/api/h/invalid')
    expect(result.status).toBe(400)
  })

  it('returns 400 on UUID v4 (not v7)', async () => {
    const uuidV4 = '550e8400-e29b-41d4-a716-446655440000'
    const result = await fetch(`/api/h/${uuidV4}`)
    expect(result.status).toBe(400)
  })

  it('returns 404 on non-existent webhook', async () => {
    const id = uuidv7()
    const result = await fetch(`/api/h/${id}`)
    expect(result.status).toBe(404)
  })

  // ── Default response ───────────────────────────────────────────────────────

  describe('default webhook config', () => {
    let id: string

    beforeAll(async () => {
      const webhook = await trpc.webhook.create.mutate()
      id = webhook.id
    })

    it('returns 200', async () => {
      const result = await fetch(`/api/h/${id}`)
      expect(result.status).toBe(200)
    })

    it('returns {"status":"ok"} body', async () => {
      const result = await fetch(`/api/h/${id}`)
      expect(await result.json()).toEqual({ status: 'ok' })
    })

    it('sets Content-Type to application/json', async () => {
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('content-type')).toContain('application/json')
    })

    it('does not set CORS headers', async () => {
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('access-control-allow-origin')).toBeNull()
      expect(result.headers.get('access-control-allow-methods')).toBeNull()
    })
  })

  // ── Custom response status ─────────────────────────────────────────────────

  describe('custom response status', () => {
    it('returns configured 2xx status (201)', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseStatus: 201 })
      const result = await fetch(`/api/h/${id}`)
      expect(result.status).toBe(201)
    })

    it('returns configured 4xx status (400)', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseStatus: 400 })
      const result = await fetch(`/api/h/${id}`)
      expect(result.status).toBe(400)
    })

    it('returns configured 5xx status (503)', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseStatus: 503 })
      const result = await fetch(`/api/h/${id}`)
      expect(result.status).toBe(503)
    })
  })

  // ── Custom response body ───────────────────────────────────────────────────

  describe('custom response body', () => {
    it('returns configured JSON body', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseBody: '{"hello":"world"}' })
      const result = await fetch(`/api/h/${id}`)
      expect(await result.json()).toEqual({ hello: 'world' })
    })

    it('returns configured plain-text body', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({
        webhookId: id,
        responseBody: 'hello world',
        responseContentType: 'text/plain',
      })
      const result = await fetch(`/api/h/${id}`)
      expect(await result.text()).toBe('hello world')
    })
  })

  // ── Content-Type ───────────────────────────────────────────────────────────

  describe('content-type header', () => {
    it('sets text/plain when configured', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseContentType: 'text/plain' })
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('content-type')).toContain('text/plain')
    })

    it('sets text/html when configured', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseContentType: 'text/html' })
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('content-type')).toContain('text/html')
    })

    it('sets application/xml when configured', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseContentType: 'application/xml' })
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('content-type')).toContain('application/xml')
    })
  })

  // ── CORS ───────────────────────────────────────────────────────────────────

  describe('CORS headers', () => {
    it('adds Access-Control headers when allowCors is true', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, allowCors: true })
      const result = await fetch(`/api/h/${id}`)
      expect(result.headers.get('access-control-allow-origin')).toBe('*')
      expect(result.headers.get('access-control-allow-methods')).toBe(
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      )
      expect(result.headers.get('access-control-allow-headers')).toBe(
        'Content-Type, Authorization',
      )
    })
  })

  // ── Response delay ─────────────────────────────────────────────────────────

  describe('response delay', () => {
    it('delays response by at least the configured ms', async () => {
      const { id } = await trpc.webhook.create.mutate()
      await trpc.webhook.update.mutate({ webhookId: id, responseDelay: 100 })
      const start = Date.now()
      await fetch(`/api/h/${id}`)
      expect(Date.now() - start).toBeGreaterThanOrEqual(100)
    })
  })

  // ── HTTP methods ───────────────────────────────────────────────────────────

  describe('HTTP methods', () => {
    let id: string

    beforeAll(async () => {
      const webhook = await trpc.webhook.create.mutate()
      id = webhook.id
    })

    it.each(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const)(
      'accepts %s requests',
      async (method) => {
        const result = await fetch(`/api/h/${id}`, { method })
        expect(result.status).toBe(200)
      },
    )
  })
})
