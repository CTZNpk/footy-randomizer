import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { players, votes } from '@/lib/db'
import { EMAIL_PATTERN, RATING_MAX, RATING_MIN } from '@/lib/constants'

type Submission = { email: string; ratings: { playerId: string; rating: number }[] }

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.toLowerCase().trim()

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const existing = await (await votes()).find({ voterEmail: email }).toArray()

  return NextResponse.json(
    existing.map((vote) => ({ playerId: vote.playerId.toHexString(), rating: vote.rating })),
  )
}

export async function POST(request: Request) {
  const { email, ratings }: Submission = await request.json()
  const voterEmail = typeof email === 'string' ? email.toLowerCase().trim() : ''

  if (!EMAIL_PATTERN.test(voterEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: 'Rate at least one player' }, { status: 400 })
  }

  const outOfRange = ratings.some(
    (entry) =>
      !Number.isInteger(entry.rating) ||
      entry.rating < RATING_MIN ||
      entry.rating > RATING_MAX,
  )
  if (outOfRange) {
    return NextResponse.json(
      { error: `Ratings must be whole numbers between ${RATING_MIN} and ${RATING_MAX}` },
      { status: 400 },
    )
  }

  const ids = ratings.map((entry) => new ObjectId(entry.playerId))
  const open = await (await players())
    .countDocuments({ _id: { $in: ids }, active: true, pollOpen: true })

  if (open !== ids.length) {
    return NextResponse.json(
      { error: 'Voting has closed for one of those players — reload and try again' },
      { status: 409 },
    )
  }

  const now = new Date()
  await (await votes()).bulkWrite(
    ratings.map((entry) => ({
      updateOne: {
        filter: { playerId: new ObjectId(entry.playerId), voterEmail },
        update: {
          $set: { rating: entry.rating, updatedAt: now },
          $setOnInsert: { disregarded: false, createdAt: now },
        },
        upsert: true,
      },
    })),
  )

  return NextResponse.json({ ok: true })
}
