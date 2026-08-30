'use client'

import { useEffect, useState } from 'react'
import PlayerList from './PlayerList'
import TeamsPanel from './TeamsPanel'
import Wheel from './Wheel'
import { draftTeams, Pick, planSpins, remainingPool, Spin } from '@/lib/draft'
import { cryptoRandom } from '@/lib/random'
import { MIN_POOL_SIZE } from '@/lib/constants'
import { PlayerView, Team } from '@/lib/types'

type Run = { pool: PlayerView[]; order: Pick<PlayerView>[]; spins: Spin[] }

export default function Randomizer({ players }: { players: PlayerView[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [run, setRun] = useState<Run | null>(null)
  const [started, setStarted] = useState(0)
  const [settled, setSettled] = useState(0)

  const spinning = started > settled
  const finished = run !== null && settled === run.order.length

  useEffect(() => {
    if (!run || started === settled) return

    const timer = setTimeout(
      () => setSettled(started === run.order.length - 1 ? run.order.length : started),
      run.spins[started - 1].durationMs,
    )
    return () => clearTimeout(timer)
  }, [run, started, settled])

  const reset = () => {
    setRun(null)
    setStarted(0)
    setSettled(0)
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (!next.delete(id)) next.add(id)
    setSelected(next)
    reset()
  }

  const selectAll = () => {
    setSelected(new Set(players.map((player) => player.id)))
    reset()
  }

  const clear = () => {
    setSelected(new Set())
    reset()
  }

  const spin = () => {
    if (run && !finished) {
      setStarted(settled + 1)
      return
    }

    const pool = players.filter((player) => selected.has(player.id))
    const order = draftTeams(pool, cryptoRandom)
    setRun({ pool, order, spins: planSpins(pool, order.slice(0, -1), cryptoRandom) })
    setStarted(1)
    setSettled(0)
  }

  const wheelPool = run
    ? remainingPool(run.pool, run.order, settled)
    : players.filter((player) => selected.has(player.id))
  const rotation = started > 0 ? run!.spins[started - 1].rotation : 0
  const drafted = run ? run.order.slice(0, settled) : []
  const teamOf = (team: Team) =>
    drafted.filter((pick) => pick.team === team).map((pick) => pick.player)
  const remaining = run ? run.order.length - settled : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1.4fr)_1fr]">
      <div className="order-1 lg:order-2">
        {wheelPool.length > 0 ? (
          <Wheel
            pool={wheelPool}
            rotation={rotation}
            durationMs={spinning ? run!.spins[started - 1].durationMs : 0}
          />
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-full border-2 border-dashed border-line text-center text-sm text-muted">
            {finished ? 'Every player drafted' : `Pick at least ${MIN_POOL_SIZE} players`}
            <br />
            {finished ? 'Spin again for a new draft' : 'to spin the wheel'}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={spin}
            disabled={selected.size < MIN_POOL_SIZE || spinning}
            className="rounded-lg bg-turf px-6 py-2.5 font-bold text-pitch transition hover:bg-turf-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {finished ? 'Spin again' : 'Spin'}
          </button>
          {run && !finished && (
            <p className="text-sm text-muted">
              {remaining} {remaining === 1 ? 'player' : 'players'} left to draft
            </p>
          )}
        </div>
      </div>

      <div className="order-3 lg:order-1">
        <TeamsPanel team="A" players={teamOf('A')} />
      </div>

      <div className="order-4 lg:order-3">
        <TeamsPanel team="B" players={teamOf('B')} />
      </div>

      <div className="order-2 lg:order-4 lg:col-span-3">
        <PlayerList
          players={players}
          selected={selected}
          onToggle={toggle}
          onSelectAll={selectAll}
          onClear={clear}
          disabled={spinning}
        />
      </div>
    </div>
  )
}
