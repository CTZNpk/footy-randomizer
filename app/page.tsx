import Link from 'next/link'
import Randomizer from '@/components/Randomizer'
import { listPlayerViews } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const players = await listPlayerViews(true)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Footy</h1>
          <p className="text-sm text-muted">
            Weighted team randomizer — heavier players get a bigger slice.
          </p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/rate" className="text-turf hover:underline">
            Rate players
          </Link>
          <Link href="/admin" className="text-muted hover:underline">
            Admin
          </Link>
        </nav>
      </header>

      <Randomizer players={players} />
    </main>
  )
}
