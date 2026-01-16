import { neon } from '@neondatabase/serverless'
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: NeonHttpDatabase<typeof schema> | null = null

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    const sql = neon(process.env.DATABASE_URL, {
      fetchOptions: {
        cache: 'no-store',
      },
    })
    _db = drizzle(sql, { schema })
  }
  return _db
}

// For backwards compatibility - will lazy initialize
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>]
  },
})
