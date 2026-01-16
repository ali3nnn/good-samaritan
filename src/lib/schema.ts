import { pgTable, uuid, varchar, text, decimal, timestamp } from 'drizzle-orm/pg-core'

export const pins = pgTable('pins', {
  id: uuid('id').defaultRandom().primaryKey(),
  lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
  lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  pinId: uuid('pin_id').references(() => pins.id, { onDelete: 'cascade' }).notNull(),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Pin = typeof pins.$inferSelect
export type NewPin = typeof pins.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
