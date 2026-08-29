import { NextResponse } from 'next/server'
import { players } from '@/lib/db'

export async function POST(request: Request) {
  const { name } = await request.json()

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const collection = await players()
  const existing = await collection.findOne({ name: name.trim() })
  if (existing) {
    return NextResponse.json({ error: 'A player with that name already exists' }, { status: 409 })
  }

  await collection.insertOne({
    name: name.trim(),
    lockedRating: 0,
    pollOpen: false,
    active: true,
    ratingHistory: [],
    createdAt: new Date(),
  } as never)

  return NextResponse.json({ ok: true }, { status: 201 })
}
