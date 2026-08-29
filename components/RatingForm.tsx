'use client'

import { useState } from 'react'
import { EMAIL_PATTERN, RATING_MAX, RATING_MIN } from '@/lib/constants'

type Poll = { id: string; name: string }

const SCALE = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => RATING_MIN + i)

export default function RatingForm({ polls }: { polls: Poll[] }) {
  const [email, setEmail] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadExisting = async () => {
    if (!EMAIL_PATTERN.test(email)) return

    const response = await fetch(`/api/votes?email=${encodeURIComponent(email)}`)
    if (!response.ok) return

    const existing: { playerId: string; rating: number }[] = await response.json()
    setRatings(Object.fromEntries(existing.map((vote) => [vote.playerId, vote.rating])))
    if (existing.length > 0) setStatus('Loaded your previous ratings — change any of them and resubmit.')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setSaving(true)

    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        ratings: Object.entries(ratings).map(([playerId, rating]) => ({ playerId, rating })),
      }),
    })

    const body = await response.json()
    setSaving(false)

    if (response.ok) setStatus('Thanks — your ratings are in.')
    else setError(body.error)
  }

  if (polls.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-pitch-soft/60 p-6 text-center text-muted">
        No polls are open right now. Check back when the admin opens one.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border border-line bg-pitch-soft/60 p-4">
        <label className="block text-sm font-medium" htmlFor="email">
          Your email
        </label>
        <p className="mb-2 text-xs text-muted">
          Used to make sure everyone rates a player only once. You can come back and change your
          ratings with the same email.
        </p>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={loadExisting}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-line bg-pitch px-3 py-2 outline-none focus:border-turf"
        />
      </div>

      <div className="rounded-xl border border-line bg-pitch-soft/60 p-4">
        <h2 className="mb-1 font-semibold">Rate out of {RATING_MAX}</h2>
        <p className="mb-4 text-xs text-muted">Skip anyone you don&rsquo;t want to rate.</p>

        <ul className="space-y-4">
          {polls.map((poll) => (
            <li key={poll.id} className="flex flex-wrap items-center gap-3">
              <span className="w-32 shrink-0 truncate font-medium">{poll.name}</span>
              <div className="flex flex-wrap gap-1">
                {SCALE.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRatings((current) => {
                        const next = { ...current }
                        if (next[poll.id] === value) delete next[poll.id]
                        else next[poll.id] = value
                        return next
                      })
                    }
                    className={`h-8 w-8 rounded border text-sm transition ${
                      ratings[poll.id] === value
                        ? 'border-turf bg-turf font-bold text-pitch'
                        : 'border-line hover:border-turf/60'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">{error}</p>}
      {status && <p className="rounded-lg bg-turf/15 px-4 py-2 text-sm text-turf-soft">{status}</p>}

      <button
        type="submit"
        disabled={saving || Object.keys(ratings).length === 0}
        className="rounded-lg bg-turf px-6 py-2.5 font-bold text-pitch transition hover:bg-turf-soft disabled:opacity-40"
      >
        {saving ? 'Submitting…' : 'Submit ratings'}
      </button>
    </form>
  )
}
