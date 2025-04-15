import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import { text, timestamp, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core'

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
    title: varchar('title'),
    preview_url: varchar('preview_url'),
    video_url: varchar('video_url'),
    exif: jsonb('exif'),
    labels: jsonb('labels'),
    width: integer('width'),
    height: integer('height'),
    detail: text('detail'),
    lat: varchar('lat'),
    lon: varchar('lon'),
    type: varchar('type'),
    show: integer('show').default(1),
    sort: integer('sort').default(0),
    del: integer('del').default(0),
    show_on_mainpage: boolean('show_on_mainpage').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
}

export const albums = {
  name: 'albums',
  columns: {
    id: varchar('id').primaryKey(),
    userId: varchar('user_id').notNull(),
    name: varchar('name').notNull(),
    description: text('description'),
    cover: varchar('cover'),
    image_sorting: varchar('image_sorting').default('created_at_desc'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
}

export const imagesAlbumsRelation = {
  name: 'images_albums_relation',
  columns: {
    id: varchar('id').primaryKey(),
    imageId: varchar('image_id').notNull(),
    albumId: varchar('album_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
}

export const db = drizzle(client, { schema: { images, albums, imagesAlbumsRelation } })

export function createTable(name: string, columns: any) {
  return {
    name,
    columns,
  }
} 