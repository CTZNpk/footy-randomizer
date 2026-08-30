import { describe, expect, it } from 'vitest'
import { draftTeams, planSpins, remainingPool } from '../draft'
import { sliceBounds } from '../weights'
import { MIN_TURNS } from '../constants'
import { pickIndex, RandomSource } from '../random'

function sequence(values: number[]): RandomSource {
  let i = 0
  return () => values[i++ % values.length]
}

function mulberry(seed: number): RandomSource {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const players = (weights: number[]) => weights.map((weight, i) => ({ name: `p${i}`, weight }))

describe('pickIndex', () => {
  it('lands in the slice the random value falls into', () => {
    const fractions = [0.2, 0.3, 0.5]
    expect(pickIndex(fractions, () => 0.1)).toBe(0)
    expect(pickIndex(fractions, () => 0.4)).toBe(1)
    expect(pickIndex(fractions, () => 0.9)).toBe(2)
  })

  it('tracks the weights across many draws', () => {
    const random = mulberry(7)
    const counts = [0, 0]
    for (let i = 0; i < 20000; i++) counts[pickIndex([0.25, 0.75], random)]++
    expect(counts[1] / counts[0]).toBeGreaterThan(2.5)
    expect(counts[1] / counts[0]).toBeLessThan(3.5)
  })
})

describe('draftTeams', () => {
  it('splits an even pool down the middle', () => {
    const order = draftTeams(players([1, 2, 3, 4, 5, 6]), mulberry(1))
    expect(order.filter((p) => p.team === 'A')).toHaveLength(3)
    expect(order.filter((p) => p.team === 'B')).toHaveLength(3)
  })

  it('gives team A the extra player on an odd pool', () => {
    const order = draftTeams(players([1, 2, 3, 4, 5]), mulberry(1))
    expect(order.filter((p) => p.team === 'A')).toHaveLength(3)
    expect(order.filter((p) => p.team === 'B')).toHaveLength(2)
  })

  it('always gives team A the first pick', () => {
    for (let seed = 0; seed < 40; seed++) {
      expect(draftTeams(players([1, 2, 3, 4]), mulberry(seed))[0].team).toBe('A')
    }
  })

  it('drafts every player exactly once', () => {
    const pool = players([4, -2, 9, 0, 3])
    const order = draftTeams(pool, mulberry(3))
    expect(new Set(order.map((p) => p.player.name)).size).toBe(pool.length)
  })

  it('drafts a player with a negative weight', () => {
    const order = draftTeams(players([10, 10, -5]), mulberry(2))
    expect(order.map((p) => p.player.weight)).toContain(-5)
  })

  it('is deterministic for a given random source', () => {
    const names = (seed: number) =>
      draftTeams(players([1, 5, 9, 2]), mulberry(seed)).map((p) => p.player.name)
    expect(names(42)).toEqual(names(42))
  })

  it('drafts the heaviest player early across many runs', () => {
    let firstRoundPicks = 0
    for (let seed = 0; seed < 300; seed++) {
      const order = draftTeams(players([1, 1, 1, 20]), mulberry(seed))
      if (order[0].player.weight === 20) firstRoundPicks++
    }
    expect(firstRoundPicks).toBeGreaterThan(150)
  })

  it('snakes teams in draft order', () => {
    const order = draftTeams(players([1, 2, 3, 4, 5, 6, 7, 8]), sequence([0.5]))
    expect(order.map((p) => p.team)).toEqual(['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A'])
  })

  it('balances the teams when the pick order runs strongest first', () => {
    const pool = players([10, 8, 6, 4])
    const order = draftTeams(pool, () => 0)

    const total = (team: 'A' | 'B') =>
      order.filter((p) => p.team === team).reduce((sum, p) => sum + p.player.weight, 0)

    expect(order.map((p) => p.player.weight)).toEqual([10, 8, 6, 4])
    expect(total('A')).toBe(total('B'))
  })

  it('never exceeds half the pool on either side', () => {
    for (let size = 2; size <= 11; size++) {
      const order = draftTeams(players(Array.from({ length: size }, (_, i) => i)), mulberry(size))
      expect(order.filter((p) => p.team === 'A')).toHaveLength(Math.ceil(size / 2))
      expect(order.filter((p) => p.team === 'B')).toHaveLength(Math.floor(size / 2))
    }
  })
})

describe('planSpins', () => {
  const pool = players([1, 5, 9, 2])

  it('plans one spin per pick', () => {
    const order = draftTeams(pool, mulberry(5))
    expect(planSpins(pool, order, mulberry(6))).toHaveLength(pool.length)
  })

  it('always rotates forward by at least the minimum turns', () => {
    const order = draftTeams(pool, mulberry(5))
    const spins = planSpins(pool, order, mulberry(6))

    let previous = 0
    for (const spin of spins) {
      expect(spin.rotation - previous).toBeGreaterThanOrEqual(MIN_TURNS * 360)
      previous = spin.rotation
    }
  })

  it('gives each spin its own force', () => {
    const order = draftTeams(pool, mulberry(5))
    const spins = planSpins(pool, order, mulberry(6))
    expect(new Set(spins.map((s) => s.durationMs)).size).toBe(spins.length)
  })

  it('lands the pointer inside the winning slice', () => {
    const order = draftTeams(pool, mulberry(11))
    const spins = planSpins(pool, order, mulberry(12))

    for (let step = 0; step < order.length; step++) {
      const remaining = remainingPool(pool, order, step)
      const bounds = sliceBounds(remaining.map((p) => p.weight))
      const winner = bounds[remaining.indexOf(order[step].player)]

      const atPointer = ((-spins[step].rotation % 360) + 360) % 360
      expect(atPointer).toBeGreaterThanOrEqual(winner.start)
      expect(atPointer).toBeLessThanOrEqual(winner.end)
    }
  })
})

describe('remainingPool', () => {
  it('drops the players already drafted and keeps the original order', () => {
    const pool = players([1, 2, 3, 4])
    const order = draftTeams(pool, mulberry(9))

    expect(remainingPool(pool, order, 0)).toEqual(pool)
    expect(remainingPool(pool, order, 4)).toEqual([])

    const afterTwo = remainingPool(pool, order, 2)
    expect(afterTwo).toHaveLength(2)
    expect(afterTwo).not.toContain(order[0].player)
    expect(pool.indexOf(afterTwo[0])).toBeLessThan(pool.indexOf(afterTwo[1]))
  })
})

describe('snake draft balance', () => {
  it('keeps the teams far closer than a straight alternation would', () => {
    const pool = players([9.2, 7.8, 6.4, 5.1, 4.3, 3.0])
    const runs = 20000

    const totals = { A: 0, B: 0 }
    for (let seed = 0; seed < runs; seed++) {
      for (const pick of draftTeams(pool, mulberry(seed))) {
        totals[pick.team] += pick.player.weight
      }
    }

    expect(Math.abs(totals.A - totals.B) / runs).toBeLessThan(2)
  })
})
