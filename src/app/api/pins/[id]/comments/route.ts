import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comments, pins } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pinId } = await params
    const body = await request.json()
    const { authorName, content } = body

    if (!authorName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify pin exists
    const [pin] = await db.select().from(pins).where(eq(pins.id, pinId))
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const [newComment] = await db.insert(comments).values({
      pinId,
      authorName,
      content,
    }).returning()

    return NextResponse.json({
      id: newComment.id,
      pinId: newComment.pinId,
      authorName: newComment.authorName,
      content: newComment.content,
      createdAt: newComment.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
