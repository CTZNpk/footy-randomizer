import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { votes } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { disregarded } = await request.json()

  if (typeof disregarded !== 'boolean') {
    return NextResponse.json({ error: 'disregarded must be a boolean' }, { status: 400 })
  }

  const collection = await votes()
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { disregarded } })
  return NextResponse.json({ ok: true })
}
