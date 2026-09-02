'use client'

import FormPills from './FormPills'
import SortButton from './SortButton'
import { useSort } from '@/lib/sort'
import { PlayerView } from '@/lib/types'

const SORT_VALUES = {
  name: (player: PlayerView) => player.name,
  weight: (player: PlayerView) => player.weight,
}

export default function PlayerList({
  players,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  disabled,
}: {
  players: PlayerView[]
  selected: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
  disabled: boolean
}) {
  const { rows, sort, toggle } = useSort(players, SORT_VALUES, { key: 'weight', direction: 'desc' })

  return (
    <section className="rounded-xl border border-line bg-pitch-soft/60 p-4">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Who&rsquo;s playing today?</h2>
          <p className="text-xs text-muted">{selected.size} selected</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={onSelectAll} disabled={disabled} className="rounded border border-line px-2 py-1 hover:bg-line/40 disabled:opacity-40">
            All
          </button>
          <button onClick={onClear} disabled={disabled} className="rounded border border-line px-2 py-1 hover:bg-line/40 disabled:opacity-40">
            None
          </button>
        </div>
      </header>

      <div className="flex items-center gap-3 border-b border-line/60 pb-2 text-xs uppercase tracking-wide text-muted">
        <span className="w-4" />
        <SortButton label="Player" sortKey="name" sort={sort} onSort={toggle} className="flex-1" />
        <SortButton label="Weight" sortKey="weight" sort={sort} onSort={toggle} />
      </div>

      <ul className="divide-y divide-line/60">
        {rows.map((player) => (
          <li key={player.id}>
            <label className="flex cursor-pointer items-center gap-3 py-2 hover:bg-line/20">
              <input
                type="checkbox"
                checked={selected.has(player.id)}
                onChange={() => onToggle(player.id)}
                disabled={disabled}
                className="h-4 w-4 accent-turf"
              />
              <span className="flex-1 truncate font-medium">{player.name}</span>
              <FormPills form={player.form} />
              <span className="w-14 text-right font-mono text-sm tabular-nums">
                {player.weight.toFixed(1)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {players.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          No players yet — add some in the admin panel.
        </p>
      )}
    </section>
  )
}
