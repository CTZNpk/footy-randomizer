import { NextResponse } from 'next/server'
import { createSessionToken, passwordMatches } from '@/lib/auth'
import { SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/constants'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (typeof password !== 'string' || !passwordMatches(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
  return response
}
