'use client'

import { useState } from 'react'
import { AdminPlayerView } from '@/lib/types'

export default function RatingEditDialog({
  player,
  onCancel,
  onConfirm,
}: {
  player: AdminPlayerView
  onCancel: () => void
  onConfirm: (rating: number) => void
}) {
  const [value, setValue] = useState(player.lockedRating.toString())

  const rating = Number(value)
  const valid = value.trim().length > 0 && Number.isFinite(rating)
  const nextWeight = player.weight + (rating - player.lockedRating)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-pitch p-6">
        <h2 className="text-lg font-bold">Change {player.name}&rsquo;s rating</h2>
        <p className="mt-1 text-sm text-muted">
          This overwrites the rating locked in from the poll and changes their weight immediately.
          It is recorded in the rating history and can be reverted.
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="rating">
          New rating
        </label>
        <input
          id="rating"
          type="number"
          step="0.01"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-pitch-soft px-3 py-2 outline-none focus:border-turf"
        />

        <dl className="mt-5 space-y-1 rounded-lg border border-line bg-pitch-soft/60 p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Rating</dt>
            <dd className="font-mono">
              {player.lockedRating.toFixed(2)} → {valid ? rating.toFixed(2) : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Weight</dt>
            <dd className="font-mono">
              {player.weight.toFixed(1)} → {valid ? nextWeight.toFixed(1) : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-line/40">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(rating)}
            disabled={!valid || rating === player.lockedRating}
            className="rounded-lg bg-turf px-4 py-2 text-sm font-bold text-pitch hover:bg-turf-soft disabled:opacity-40"
          >
            Yes, change the rating
          </button>
        </div>
      </div>
    </div>
  )
}
