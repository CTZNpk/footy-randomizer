import { ObjectId } from 'mongodb'
import { players } from './db'
import { MatchWinner } from './types'

export type MatchInput = { teamA: string[]; teamB: string[]; winner: MatchWinner; playedAt: string }

export async function validateMatchInput(input: MatchInput): Promise<string | null> {
  const { teamA, teamB, winner } = input

  if (!Array.isArray(teamA) || !Array.isArray(teamB) || teamA.length === 0 || teamB.length === 0) {
    return 'Both teams need at least one player'
  }
  if (!['A', 'B', 'draw'].includes(winner)) return 'Pick a winner'

  const overlap = teamA.filter((id) => teamB.includes(id))
  if (overlap.length > 0) return 'A player cannot be on both teams'

  const ids = [...teamA, ...teamB].map((id) => new ObjectId(id))
  const found = await (await players()).countDocuments({ _id: { $in: ids } })
  if (found !== ids.length) return 'One of those players no longer exists'

  return null
}
