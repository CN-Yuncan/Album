import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import { text, timestamp, varchar } from 'drizzle-orm/pg-core'

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/album'

const client = postgres(connectionString)

export const images = {
  name: 'images',
  columns: {
    id: varchar('id').primaryKey(),
    userId: varchar('user_id').notNull(),
    key: varchar('key').notNull(),
    url: varchar('url').notNull(),
    source: varchar('source').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
}

export const db = drizzle(client, { schema: { images } })

export function createTable(name: string, columns: any) {
  return {
    name,
    columns,
  }
} 