'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchRow } from '@/lib/queries'
import { MatchWinner, PlayerView, Team } from '@/lib/types'

const today = () => new Date().toISOString().slice(0, 10)

export default function MatchesManager({
  players,
  matches,
}: {
  players: PlayerView[]
  matches: MatchRow[]
}) {
  const router = useRouter()
  const [teamA, setTeamA] = useState<string[]>([])
  const [teamB, setTeamB] = useState<string[]>([])
  const [winner, setWinner] = useState<MatchWinner>('A')
  const [playedAt, setPlayedAt] = useState(today())
  const [error, setError] = useState<string | null>(null)

  const assign = (id: string, team: Team | null) => {
    setTeamA((current) => (team === 'A' ? [...current, id] : current.filter((p) => p !== id)))
    setTeamB((current) => (team === 'B' ? [...current, id] : current.filter((p) => p !== id)))
  }

  const teamOf = (id: string): Team | null =>
    teamA.includes(id) ? 'A' : teamB.includes(id) ? 'B' : null

  const record = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const response = await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamA, teamB, winner, playedAt }),
    })

    if (!response.ok) {
      setError((await response.json()).error)
      return
    }

    setTeamA([])
    setTeamB([])
    setPlayedAt(today())
    router.refresh()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/matches/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <form onSubmit={record} className="mb-8 rounded-xl border border-line p-4">
        <h2 className="mb-1 font-bold">Record a match</h2>
        <p className="mb-4 text-xs text-muted">
          Winners get +2, losers −1. A draw changes nothing. Deleting a match undoes its effect.
        </p>

        <ul className="mb-4 space-y-1">
          {players.map((player) => {
            const team = teamOf(player.id)
            return (
              <li key={player.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{player.name}</span>
                <span className="font-mono text-xs text-muted">{player.weight.toFixed(1)}</span>
                {(['A', 'B'] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => assign(player.id, team === side ? null : side)}
                    className={`h-7 w-9 rounded border text-xs font-semibold ${
                      team === side
                        ? side === 'A'
                          ? 'border-teamA bg-teamA text-pitch'
                          : 'border-teamB bg-teamB text-pitch'
                        : 'border-line text-muted hover:border-chalk/40'
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </li>
            )
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={playedAt}
            onChange={(event) => setPlayedAt(event.target.value)}
            className="rounded-lg border border-line bg-pitch-soft px-3 py-2 text-sm"
          />
          <select
            value={winner}
            onChange={(event) => setWinner(event.target.value as MatchWinner)}
            className="rounded-lg border border-line bg-pitch-soft px-3 py-2 text-sm"
          >
            <option value="A">Team A won</option>
            <option value="B">Team B won</option>
            <option value="draw">Draw</option>
          </select>
          <button className="rounded-lg bg-turf px-5 py-2 text-sm font-bold text-pitch hover:bg-turf-soft">
            Record match
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">{error}</p>
        )}
      </form>

      <h2 className="mb-3 font-bold">History</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-muted">No matches recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((match) => (
            <li
              key={match.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3 text-sm"
            >
              <span className="text-xs text-muted">
                {match.playedAt.slice(0, 10)}
              </span>
              <span className={match.winner === 'A' ? 'font-bold text-teamA' : 'text-muted'}>
                {match.teamA.join(', ')}
              </span>
              <span className="text-xs text-muted">vs</span>
              <span className={match.winner === 'B' ? 'font-bold text-teamB' : 'text-muted'}>
                {match.teamB.join(', ')}
              </span>
              {match.winner === 'draw' && <span className="text-xs text-muted">draw</span>}
              <button
                onClick={() => remove(match.id)}
                className="ml-auto text-xs text-red-300 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
