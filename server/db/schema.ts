import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const TWebhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey(),

  responseStatus: integer('response_status').default(200),
  responseContentType: text('response_content_type').default('application/json'),
  responseBody: text('response_body').default('{"status":"ok"}'),
  responseDelay: integer('response_delay').default(0),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, table => ({
  createdAtIdx: index('idx_webhook_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_webhook_updated_at').on(table.updatedAt),
}))

export const TRequests = sqliteTable('requests', {
  id: text('id').primaryKey(),

  webhookId: text('webhook_id')
    .notNull()
    .references(() => TWebhooks.id, { onDelete: 'cascade' }),

  method: text('method').notNull(),
  url: text('url').notNull(),
  headers: text('headers').notNull(),
  queryParams: text('query_params'),
  body: text('body'),
  ipAddress: text('ip_address'),
  cfProperties: text('cf_properties'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
}, table => ({
  webhookIdx: index('idx_request_webhook_id').on(table.webhookId),
  createdAtIdx: index('idx_request_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_request_updated_at').on(table.updatedAt),
  methodIdx: index('idx_request_method').on(table.method),
  urlIdx: index('idx_request_url').on(table.url),
  ipAddressIdx: index('idx_request_ip_address').on(table.ipAddress),
}))

export const RWebhooks = relations(TWebhooks, ({ many }) => ({
  requests: many(TRequests),
}))

export const RRequests = relations(TRequests, ({ one }) => ({
  webhook: one(TWebhooks, {
    fields: [TRequests.webhookId],
    references: [TWebhooks.id],
  }),
}))
