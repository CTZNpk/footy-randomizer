import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { players } from '@/lib/db'
import { setLockedRating } from '@/lib/queries'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const { index } = await request.json()
  const playerId = new ObjectId(id)

  const player = await (await players()).findOne({ _id: playerId })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const change = player.ratingHistory[index]
  if (!change) {
    return NextResponse.json({ error: 'That rating change no longer exists' }, { status: 400 })
  }

  await setLockedRating(playerId, change.from, 'revert')
  return NextResponse.json({ ok: true, lockedRating: change.from })
}
