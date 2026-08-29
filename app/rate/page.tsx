import Link from 'next/link'
import RatingForm from '@/components/RatingForm'
import { openPollPlayers } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function RatePage() {
  const polls = await openPollPlayers()

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted hover:underline">
          ← Back to the wheel
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Rate the players</h1>
        <p className="text-sm text-muted">
          The average of everyone&rsquo;s ratings becomes a player&rsquo;s starting weight.
        </p>
      </header>

      <RatingForm polls={polls} />
    </main>
  )
}
