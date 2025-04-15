import { sql } from 'drizzle-orm'
import { text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { createTable } from '~/server/db'

export const images = createTable('images', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull(),
  key: varchar('key').notNull(),
  url: varchar('url').notNull(),
  source: varchar('source').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}) 