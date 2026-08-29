import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { matches } from '@/lib/db'
import { validateMatchInput } from '@/lib/matches'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const input = await request.json()

  const error = await validateMatchInput(input)
  if (error) return NextResponse.json({ error }, { status: 400 })

  await (await matches()).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        playedAt: new Date(input.playedAt),
        teamA: input.teamA.map((playerId: string) => new ObjectId(playerId)),
        teamB: input.teamB.map((playerId: string) => new ObjectId(playerId)),
        winner: input.winner,
      },
    },
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  await (await matches()).deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ ok: true })
}
