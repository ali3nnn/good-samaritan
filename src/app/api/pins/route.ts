import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pins } from '@/lib/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const allPins = await db.select().from(pins)

    const formattedPins = allPins.map(pin => ({
      id: pin.id,
      lat: parseFloat(pin.lat),
      lng: parseFloat(pin.lng),
      title: pin.title,
      description: pin.description,
      authorName: pin.authorName,
      createdAt: pin.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedPins)
  } catch (error) {
    console.error('Error fetching pins:', error)
    return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, title, description, authorName } = body

    if (!lat || !lng || !title || !description || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [newPin] = await db.insert(pins).values({
      lat: lat.toString(),
      lng: lng.toString(),
      title,
      description,
      authorName,
    }).returning()

    return NextResponse.json({
      id: newPin.id,
      lat: parseFloat(newPin.lat),
      lng: parseFloat(newPin.lng),
      title: newPin.title,
      description: newPin.description,
      authorName: newPin.authorName,
      createdAt: newPin.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pin:', error)
    return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 })
  }
}
