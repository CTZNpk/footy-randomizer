import { describe, expect, it } from 'vitest'
import { averageRating, playerWeight, recentForm, sliceFractions } from '../weights'
import { Outcome } from '../types'

describe('averageRating', () => {
  it('averages the ratings it is given', () => {
    expect(averageRating([8, 6, 7])).toBeCloseTo(7)
  })

  it('returns null when there is nothing to average', () => {
    expect(averageRating([])).toBeNull()
  })
})

describe('playerWeight', () => {
  it('applies +2 per win and -1 per loss', () => {
    expect(playerWeight(6.5, ['W', 'L', 'L', 'L'])).toBeCloseTo(5.5)
  })

  it('leaves draws alone', () => {
    expect(playerWeight(4, ['D', 'D', 'D'])).toBe(4)
  })

  it('goes negative when losses outweigh the locked rating', () => {
    expect(playerWeight(1, ['L', 'L', 'L', 'L'])).toBe(-3)
  })
})

describe('recentForm', () => {
  it('keeps the most recent five, newest last', () => {
    const outcomes: Outcome[] = ['W', 'W', 'L', 'D', 'L', 'W', 'W']
    expect(recentForm(outcomes)).toEqual(['L', 'D', 'L', 'W', 'W'])
  })

  it('returns everything when fewer than five matches were played', () => {
    expect(recentForm(['W', 'L'])).toEqual(['W', 'L'])
  })
})

describe('sliceFractions', () => {
  it('sums to one', () => {
    const fractions = sliceFractions([6.5, -3, 0, 9])
    expect(fractions.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('gives every player a non-zero slice even with negative weights', () => {
    for (const fraction of sliceFractions([-3, -1, 4])) {
      expect(fraction).toBeGreaterThan(0)
    }
  })

  it('gives equal slices when every weight is identical', () => {
    expect(sliceFractions([5, 5, 5])).toEqual([1 / 3, 1 / 3, 1 / 3])
  })

  it('gives the heavier player the bigger slice', () => {
    const [light, heavy] = sliceFractions([2, 8])
    expect(heavy).toBeGreaterThan(light)
  })
})
