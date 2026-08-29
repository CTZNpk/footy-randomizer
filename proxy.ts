import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from './lib/constants'
import { verifySessionToken } from './lib/auth'

const PUBLIC_PATHS = ['/admin/login', '/api/admin/login']

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) return NextResponse.next()

  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/admin/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
