import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const TWebhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  responseStatus: integer('response_status').default(200),
  responseContentType: text('response_content_type').default('application/json'),
  responseBody: text('response_body').default('{"status":"ok"}'),
  responseDelay: integer('response_delay').default(0),
})

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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, table => ({
  webhookIdx: index('idx_webhook_id').on(table.webhookId),
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
