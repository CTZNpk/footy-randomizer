import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { players } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { name, active } = await request.json()

  const update: { name?: string; active?: boolean } = {}
  if (typeof name === 'string' && name.trim().length > 0) update.name = name.trim()
  if (typeof active === 'boolean') update.active = active

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const collection = await players()
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: update })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params
  const collection = await players()
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { active: false, pollOpen: false } })
  return NextResponse.json({ ok: true })
}
