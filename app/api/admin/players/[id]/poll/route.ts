import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { players } from '@/lib/db'
import { setLockedRating, usableRatings } from '@/lib/queries'
import { averageRating } from '@/lib/weights'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const collection = await players()
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { pollOpen: true } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const playerId = new ObjectId(id)

  const average = averageRating(await usableRatings(playerId))
  if (average === null) {
    return NextResponse.json(
      { error: 'No usable ratings yet — closing now would lock in a rating of 0.' },
      { status: 400 },
    )
  }

  await setLockedRating(playerId, average, 'poll-close')
  const collection = await players()
  await collection.updateOne({ _id: playerId }, { $set: { pollOpen: false } })

  return NextResponse.json({ ok: true, lockedRating: average })
}
