import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/album'

const client = postgres(connectionString)
export const db = drizzle(client, { schema })

export function createTable(name: string, columns: any) {
  return {
    name,
    columns,
  }
} 