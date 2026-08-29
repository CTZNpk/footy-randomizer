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
  const [step, setStep] = useState(0)

  const spinning = run !== null && step < run.order.length

  useEffect(() => {
    if (!run || step >= run.order.length) return

    const timer = setTimeout(() => setStep((current) => current + 1), run.spins[step].durationMs)
    return () => clearTimeout(timer)
  }, [run, step])

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (!next.delete(id)) next.add(id)
    setSelected(next)
    setRun(null)
    setStep(0)
  }

  const selectAll = () => {
    setSelected(new Set(players.map((player) => player.id)))
    setRun(null)
    setStep(0)
  }

  const clear = () => {
    setSelected(new Set())
    setRun(null)
    setStep(0)
  }

  const spin = () => {
    const pool = players.filter((player) => selected.has(player.id))
    const order = draftTeams(pool, cryptoRandom)
    setRun({ pool, order, spins: planSpins(pool, order, cryptoRandom) })
    setStep(0)
  }

  const skip = () => run && setStep(run.order.length)

  const wheelPool = spinning
    ? remainingPool(run.pool, run.order, step)
    : players.filter((player) => selected.has(player.id))
  const rotation = run ? run.spins[Math.min(step, run.order.length - 1)].rotation : 0
  const drafted = run ? run.order.slice(0, step) : []
  const teamOf = (team: Team) =>
    drafted.filter((pick) => pick.team === team).map((pick) => pick.player)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1.4fr)_1fr]">
      <div className="order-1 lg:order-2">
        {wheelPool.length > 0 ? (
          <Wheel
            pool={wheelPool}
            rotation={rotation}
            durationMs={spinning ? run.spins[step].durationMs : 0}
          />
        ) : (
          <div className="mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-full border-2 border-dashed border-line text-center text-sm text-muted">
            Pick at least {MIN_POOL_SIZE} players
            <br />
            to spin the wheel
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={spin}
            disabled={selected.size < MIN_POOL_SIZE || spinning}
            className="rounded-lg bg-turf px-6 py-2.5 font-bold text-pitch transition hover:bg-turf-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {run && !spinning ? 'Spin again' : 'Spin'}
          </button>
          {spinning && (
            <button
              onClick={skip}
              className="rounded-lg border border-line px-6 py-2.5 text-sm hover:bg-line/40"
            >
              Skip animation
            </button>
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
