'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingEditDialog from './RatingEditDialog'
import FormPills from './FormPills'
import { AdminPlayerView } from '@/lib/types'

export default function PlayersTable({ players }: { players: AdminPlayerView[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminPlayerView | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const send = async (url: string, method: string, body?: unknown) => {
    setError(null)
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) setError((await response.json()).error)
    router.refresh()
    return response.ok
  }

  const addPlayer = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await send('/api/admin/players', 'POST', { name })) setName('')
  }

  return (
    <>
      <form onSubmit={addPlayer} className="mb-6 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New player name"
          className="flex-1 rounded-lg border border-line bg-pitch-soft px-3 py-2 outline-none focus:border-turf"
        />
        <button className="rounded-lg bg-turf px-5 font-bold text-pitch hover:bg-turf-soft">
          Add player
        </button>
      </form>

      {error && <p className="mb-4 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-pitch-soft text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-3">Player</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Weight</th>
              <th className="p-3">Record</th>
              <th className="p-3">Form</th>
              <th className="p-3">Poll</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {players.map((player) => (
              <Fragment key={player.id}>
                <tr className={player.active ? '' : 'opacity-40'}>
                  <td className="p-3 font-medium">{player.name}</td>
                  <td className="p-3 font-mono tabular-nums">{player.lockedRating.toFixed(2)}</td>
                  <td className="p-3 font-mono tabular-nums">{player.weight.toFixed(1)}</td>
                  <td className="p-3 text-muted">
                    {player.wins}W {player.losses}L {player.draws}D
                  </td>
                  <td className="p-3">
                    <FormPills form={player.form} />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        send(`/api/admin/players/${player.id}/poll`, player.pollOpen ? 'DELETE' : 'POST')
                      }
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        player.pollOpen ? 'bg-turf text-pitch' : 'border border-line text-muted'
                      }`}
                    >
                      {player.pollOpen ? 'Open — click to close' : 'Closed'}
                    </button>
                  </td>
                  <td className="space-x-2 whitespace-nowrap p-3 text-right text-xs">
                    <button onClick={() => setEditing(player)} className="text-turf hover:underline">
                      Edit rating
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === player.id ? null : player.id)}
                      className="text-muted hover:underline"
                    >
                      History ({player.ratingHistory.length})
                    </button>
                    <button
                      onClick={() =>
                        send(`/api/admin/players/${player.id}`, 'PATCH', { active: !player.active })
                      }
                      className="text-muted hover:underline"
                    >
                      {player.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>

                {expanded === player.id && (
                  <tr className="bg-pitch-soft/50">
                    <td colSpan={7} className="p-3">
                      {player.ratingHistory.length === 0 ? (
                        <p className="text-xs text-muted">This rating has never been changed.</p>
                      ) : (
                        <ul className="space-y-1 text-xs">
                          {player.ratingHistory.map((change, i) => (
                            <li key={i} className="flex items-center gap-3">
                              <span className="w-40 text-muted">
                                {change.at.slice(0, 16).replace('T', ' ')}
                              </span>
                              <span className="rounded bg-line/50 px-2 py-0.5">{change.source}</span>
                              <span className="font-mono">
                                {change.from.toFixed(2)} → {change.to.toFixed(2)}
                              </span>
                              <button
                                onClick={() =>
                                  send(`/api/admin/players/${player.id}/rating/revert`, 'POST', {
                                    index: i,
                                  })
                                }
                                className="text-turf hover:underline"
                              >
                                Revert to {change.from.toFixed(2)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {players.length === 0 && <p className="p-6 text-center text-muted">No players yet.</p>}
      </div>

      {editing && (
        <RatingEditDialog
          player={editing}
          onCancel={() => setEditing(null)}
          onConfirm={async (rating) => {
            await send(`/api/admin/players/${editing.id}/rating`, 'PATCH', { rating })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
