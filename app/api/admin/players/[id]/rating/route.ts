import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { setLockedRating } from '@/lib/queries'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const { rating } = await request.json()

  if (typeof rating !== 'number' || !Number.isFinite(rating)) {
    return NextResponse.json({ error: 'Rating must be a number' }, { status: 400 })
  }

  await setLockedRating(new ObjectId(id), rating, 'admin-edit')
  return NextResponse.json({ ok: true })
}
