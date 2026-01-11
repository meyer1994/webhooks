import { and, eq, type SQL } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { uuidv7 } from 'uuidv7'
import * as schema from '~~/server/db/schema'

// https://stackoverflow.com/a/54975267
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

type ListOptions = {
  limit?: number
  filter?: string
}

type WebhookInsert = typeof schema.TWebhooks.$inferInsert
type WebhookSelect = typeof schema.TWebhooks.$inferSelect

type ItemWebhookInsert = Omit<WebhookInsert, 'id' | 'createdAt' | 'updatedAt'>
type ItemWebhookSelect = WebhookSelect

type RequestInsert = typeof schema.TRequests.$inferInsert
type RequestSelect = typeof schema.TRequests.$inferSelect

type TItemRequestInsert = Overwrite<RequestInsert, {
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  cfProperties?: Partial<CfProperties>
}>

type ItemRequestInsert = Omit<TItemRequestInsert, 'id' | 'webhookId' | 'createdAt' | 'updatedAt'>

type ItemRequestSelect = Overwrite<RequestSelect, {
  headers: Record<string, string>
  queryParams: Record<string, string>
  cfProperties: Partial<CfProperties>
}>

export interface IRepo {
  /**
   * Create a new webhook
   *
   * @param webhook - The webhook to create
   * @returns The created webhook
   */
  create(webhook: ItemWebhookInsert): Promise<ItemWebhookSelect>

  /**
   * Get a webhook by ID
   *
   * @param wid - The ID of the webhook
   * @returns The webhook
   */
  config(wid: string): Promise<ItemWebhookSelect>

  /**
   * Get a request by ID
   *
   * @param wid - The ID of the webhook
   * @param rid - The ID of the request
   * @returns The request
   */
  request(wid: string, rid: string): Promise<ItemRequestSelect>

  /**
   * List requests for a webhook
   *
   * @param wid - The ID of the webhook
   * @param options - The options for the list
   * @returns The requests
   */
  list(wid: string, options?: ListOptions): Promise<ItemRequestSelect[]>

  /**
   * Append a request to a webhook
   *
   * @param wid - The ID of the webhook
   * @param data - The data to append
   * @returns The appended request
   */
  append(wid: string, data: ItemRequestInsert): Promise<ItemRequestSelect>

  /**
   * Update a request by ID
   *
   * @param wid - The ID of the webhook
   * @param rid - The ID of the request
   * @param data - The data to update
   * @returns The updated request
   */
  delete(wid: string, rid: string): Promise<ItemRequestSelect>

  /**
   * Update a webhook by ID
   *
   * @param wid - The ID of the webhook
   * @param data - The data to update
   * @returns The updated webhook
   */
  update(wid: string, data: ItemWebhookInsert): Promise<ItemWebhookSelect>
}

export class WebhookRepo implements IRepo {
  constructor(private db: DrizzleD1Database<typeof schema>) {}

  async delete(wid: string, rid: string): Promise<ItemRequestSelect> {
    const result = await this.db
      .delete(schema.TRequests)
      .where(
        and(
          eq(schema.TRequests.id, rid),
          eq(schema.TRequests.webhookId, wid)))
      .returning()
      .get()

    if (!result)
      throw createError({
        statusCode: 404,
        message: `Request not found: /w/${wid}/r/${rid}`,
      })

    return {
      ...result,
      headers: JSON.parse(result.headers || '{}'),
      queryParams: JSON.parse(result.queryParams || '{}'),
      cfProperties: JSON.parse(result.cfProperties || '{}'),
    }
  }

  async update(wid: string, data: ItemWebhookInsert): Promise<ItemWebhookSelect> {
    const result = await this.db
      .update(schema.TWebhooks)
      .set(data)
      .where(eq(schema.TWebhooks.id, wid))
      .returning()
      .get()

    if (!result)
      throw createError({
        statusCode: 404,
        message: `Webhook not found: /w/${wid}`,
      })

    return result
  }

  async config(wid: string): Promise<WebhookSelect> {
    const result = await this.db.query.TWebhooks.findFirst({
      where: (t, s) => s.eq(t.id, wid),
    })

    if (!result)
      throw createError({
        statusCode: 404,
        message: `Webhook not found: ${wid}`,
      })

    return result
  }

  async request(wid: string, rid: string): Promise<ItemRequestSelect> {
    const result = await this.db.query.TRequests.findFirst({
      where: (t, s) => s.and(s.eq(t.id, rid), s.eq(t.webhookId, wid)),
    })

    if (!result)
      throw createError({
        statusCode: 404,
        message: `Request not found: ${rid}`,
      })

    return {
      ...result,
      headers: JSON.parse(result.headers || '{}'),
      queryParams: JSON.parse(result.queryParams || '{}'),
      cfProperties: JSON.parse(result.cfProperties || '{}'),
    }
  }

  async create(webhook: ItemWebhookInsert): Promise<ItemWebhookSelect> {
    const id = uuidv7()
    const result = await this.db
      .insert(schema.TWebhooks)
      .values({ ...webhook, id })
      .returning()
      .get()

    if (!result)
      throw createError({
        statusCode: 500,
        message: `Failed to create webhook: ${id}`,
      })

    return result
  }

  async list(wid: string, options?: ListOptions): Promise<ItemRequestSelect[]> {
    const config = await this.db.query.TWebhooks.findFirst({
      where: (t, s) => s.eq(t.id, wid),
      with: {
        requests: {
          where: (t, s) => {
            const filters: SQL[] = [s.eq(t.webhookId, wid)]
            if (options?.filter) {
              filters.push(
                s.or(
                  s.like(t.method, `%${options.filter}%`),
                  s.like(t.url, `%${options.filter}%`),
                  s.like(t.body, `%${options.filter}%`),
                  s.like(t.id, `%${options.filter}%`),
                )!,
              )
            }
            return s.and(...filters)
          },
          orderBy: (t, s) => [s.desc(t.id), s.desc(t.createdAt)],
          limit: Math.min(options?.limit ?? 100, 100),
        },
      },
    })

    if (!config)
      throw createError({
        statusCode: 404,
        message: `Webhook not found: ${wid}`,
      })

    return config.requests.map(request => ({
      ...request,
      headers: JSON.parse(request.headers || '{}'),
      queryParams: JSON.parse(request.queryParams || '{}'),
      cfProperties: JSON.parse(request.cfProperties || '{}'),
    }))
  }

  async append(wid: string, data: ItemRequestInsert): Promise<ItemRequestSelect> {
    const id = uuidv7()
    const result = await this.db
      .insert(schema.TRequests)
      .values({
        ...data,
        id,
        webhookId: wid,
        headers: JSON.stringify(data.headers || {}),
        queryParams: JSON.stringify(data.queryParams || {}),
        cfProperties: JSON.stringify(data.cfProperties || {}),
      })
      .returning()
      .get()

    if (!result)
      throw createError({
        statusCode: 404,
        message: `Webhook not found: ${wid}`,
      })

    return {
      ...result,
      headers: JSON.parse(result.headers || '{}'),
      queryParams: JSON.parse(result.queryParams || '{}'),
      cfProperties: JSON.parse(result.cfProperties || '{}'),
    }
  }
}
