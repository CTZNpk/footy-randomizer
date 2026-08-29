import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { matches } from '@/lib/db'
import { MatchInput, validateMatchInput } from '@/lib/matches'

export async function POST(request: Request) {
  const input: MatchInput = await request.json()

  const error = await validateMatchInput(input)
  if (error) return NextResponse.json({ error }, { status: 400 })

  await (await matches()).insertOne({
    playedAt: new Date(input.playedAt),
    teamA: input.teamA.map((id) => new ObjectId(id)),
    teamB: input.teamB.map((id) => new ObjectId(id)),
    winner: input.winner,
    createdAt: new Date(),
  } as never)

  return NextResponse.json({ ok: true }, { status: 201 })
}
