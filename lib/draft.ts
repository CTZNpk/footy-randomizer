import {
  MAX_EXTRA_SPIN_MS,
  MAX_EXTRA_TURNS,
  MIN_SPIN_MS,
  MIN_TURNS,
  SLICE_EDGE_MARGIN,
} from './constants'
import { pickIndex, RandomSource } from './random'
import { sliceBounds, sliceFractions } from './weights'
import { Team } from './types'

export type Pick<T> = { player: T; team: Team }
export type Spin = { rotation: number; durationMs: number }

export function draftTeams<T extends { weight: number }>(
  players: T[],
  random: RandomSource,
): Pick<T>[] {
  const pool = [...players]
  const order: Pick<T>[] = []

  while (pool.length > 0) {
    const index = pickIndex(sliceFractions(pool.map((p) => p.weight)), random)
    order.push({ player: pool[index], team: order.length % 2 === 0 ? 'A' : 'B' })
    pool.splice(index, 1)
  }

  return order
}

export function remainingPool<T>(players: T[], order: Pick<T>[], step: number): T[] {
  const drafted = new Set(order.slice(0, step).map((pick) => pick.player))
  return players.filter((player) => !drafted.has(player))
}

export function planSpins<T extends { weight: number }>(
  players: T[],
  order: Pick<T>[],
  random: RandomSource,
): Spin[] {
  const spins: Spin[] = []
  let rotation = 0

  for (let step = 0; step < order.length; step++) {
    const pool = remainingPool(players, order, step)
    const { start, end } = sliceBounds(pool.map((p) => p.weight))[pool.indexOf(order[step].player)]
    const landing = start + (SLICE_EDGE_MARGIN + random() * (1 - 2 * SLICE_EDGE_MARGIN)) * (end - start)

    const turns = MIN_TURNS + Math.floor(random() * MAX_EXTRA_TURNS)
    rotation += turns * 360 + ((((-landing - rotation) % 360) + 360) % 360)

    spins.push({ rotation, durationMs: MIN_SPIN_MS + random() * MAX_EXTRA_SPIN_MS })
  }

  return spins
}
