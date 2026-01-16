import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pins, comments } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [pin] = await db.select().from(pins).where(eq(pins.id, id))

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const pinComments = await db
      .select()
      .from(comments)
      .where(eq(comments.pinId, id))

    pinComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      id: pin.id,
      lat: parseFloat(pin.lat),
      lng: parseFloat(pin.lng),
      title: pin.title,
      description: pin.description,
      authorName: pin.authorName,
      createdAt: pin.createdAt.toISOString(),
      comments: pinComments.map(c => ({
        id: c.id,
        pinId: c.pinId,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching pin:', error)
    return NextResponse.json({ error: 'Failed to fetch pin' }, { status: 500 })
  }
}
