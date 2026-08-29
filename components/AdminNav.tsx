'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/votes', label: 'Ratings' },
  { href: '/admin/matches', label: 'Matches' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <header className="mb-8 flex flex-wrap items-center gap-4 border-b border-line pb-4">
      <Link href="/" className="text-lg font-black tracking-tight">
        Footy <span className="text-xs font-normal text-muted">admin</span>
      </Link>
      <nav className="flex gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              pathname === tab.href ? 'bg-turf font-semibold text-pitch' : 'hover:bg-line/40'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="ml-auto text-sm text-muted hover:underline">
        Log out
      </button>
    </header>
  )
}
