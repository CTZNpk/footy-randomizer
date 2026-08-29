import { DRAW_DELTA, LOSS_DELTA, STREAK_LENGTH, WHEEL_SHIFT, WIN_DELTA } from './constants'
import { Outcome } from './types'

const OUTCOME_DELTA: Record<Outcome, number> = {
  W: WIN_DELTA,
  L: LOSS_DELTA,
  D: DRAW_DELTA,
}

export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length
}

export function playerWeight(lockedRating: number, outcomes: Outcome[]): number {
  return outcomes.reduce((weight, outcome) => weight + OUTCOME_DELTA[outcome], lockedRating)
}

export function recentForm(outcomes: Outcome[]): Outcome[] {
  return outcomes.slice(-STREAK_LENGTH)
}

export function sliceFractions(weights: number[]): number[] {
  const min = Math.min(...weights)
  const shifted = weights.map((w) => w - min + WHEEL_SHIFT)
  const total = shifted.reduce((sum, w) => sum + w, 0)
  return shifted.map((w) => w / total)
}

export function sliceBounds(weights: number[]): { start: number; end: number }[] {
  let cursor = 0
  return sliceFractions(weights).map((fraction) => {
    const start = cursor
    cursor += fraction * 360
    return { start, end: cursor }
  })
}
