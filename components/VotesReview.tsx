'use client'

import { useRouter } from 'next/navigation'
import { averageRating } from '@/lib/weights'
import { VoteReviewRow } from '@/lib/queries'

export default function VotesReview({ rows }: { rows: VoteReviewRow[] }) {
  const router = useRouter()

  const toggle = async (id: string, disregarded: boolean) => {
    await fetch(`/api/admin/votes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disregarded }),
    })
    router.refresh()
  }

  if (rows.length === 0) {
    return <p className="text-muted">No players yet.</p>
  }

  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const counted = averageRating(
          row.votes.filter((vote) => !vote.disregarded).map((vote) => vote.rating),
        )
        const all = averageRating(row.votes.map((vote) => vote.rating))

        return (
          <section key={row.id} className="rounded-xl border border-line">
            <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line bg-pitch-soft p-4">
              <h2 className="font-bold">{row.name}</h2>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  row.pollOpen ? 'bg-turf/20 text-turf-soft' : 'bg-line/50 text-muted'
                }`}
              >
                {row.pollOpen ? 'poll open' : 'poll closed'}
              </span>
              <span className="ml-auto text-sm text-muted">
                counted average{' '}
                <span className="font-mono text-chalk">{counted?.toFixed(2) ?? '—'}</span>
                {all !== null && counted !== all && (
                  <span className="ml-2 line-through">{all.toFixed(2)} with all votes</span>
                )}
                {' · '}locked{' '}
                <span className="font-mono text-chalk">{row.lockedRating.toFixed(2)}</span>
              </span>
            </header>

            {row.votes.length === 0 ? (
              <p className="p-4 text-sm text-muted">No ratings submitted yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {row.votes.map((vote) => (
                  <li
                    key={vote.id}
                    className={`flex items-center gap-4 p-3 text-sm ${
                      vote.disregarded ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="flex-1 truncate">{vote.voterEmail}</span>
                    <span className="text-xs text-muted">
                      {vote.updatedAt.slice(0, 10)}
                    </span>
                    <span className={`font-mono ${vote.disregarded ? 'line-through' : ''}`}>
                      {vote.rating}
                    </span>
                    <button
                      onClick={() => toggle(vote.id, !vote.disregarded)}
                      className="text-xs text-turf hover:underline"
                    >
                      {vote.disregarded ? 'Restore' : 'Disregard'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
