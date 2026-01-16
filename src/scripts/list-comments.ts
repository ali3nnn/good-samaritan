import { db } from '@/lib/db'
import { comments } from '@/lib/schema'
import { eq } from 'drizzle-orm'

async function listAllComments() {
    const allComments = await db.select().from(comments).where(eq(comments.pinId, 'ba17f1d9-4cc5-4def-ad7e-e3b37f6d4da0'))
    console.log('Total comments for pin:', allComments.length)
    console.log(JSON.stringify(allComments, null, 2))
    process.exit(0)
}

listAllComments().catch(console.error)
