import { ObjectId } from 'mongodb'
import { matches, players, votes } from './db'
import { playerWeight, recentForm } from './weights'
import {
  AdminPlayerView,
  Match,
  MatchWinner,
  Outcome,
  Player,
  PlayerView,
  RatingSource,
} from './types'

function outcomesFor(playerId: string, playedMatches: Match[]): Outcome[] {
  const outcomes: Outcome[] = []

  for (const match of playedMatches) {
    const inA = match.teamA.some((id) => id.toHexString() === playerId)
    const inB = match.teamB.some((id) => id.toHexString() === playerId)
    if (!inA && !inB) continue

    if (match.winner === 'draw') outcomes.push('D')
    else outcomes.push((match.winner === 'A') === inA ? 'W' : 'L')
  }

  return outcomes
}

function toView(player: Player, playedMatches: Match[]): PlayerView {
  const id = player._id.toHexString()
  const outcomes = outcomesFor(id, playedMatches)

  return {
    id,
    name: player.name,
    lockedRating: player.lockedRating,
    weight: playerWeight(player.lockedRating, outcomes),
    form: recentForm(outcomes),
    wins: outcomes.filter((o) => o === 'W').length,
    losses: outcomes.filter((o) => o === 'L').length,
    draws: outcomes.filter((o) => o === 'D').length,
  }
}

async function loadPlayers(onlyActive: boolean): Promise<{ player: Player; view: PlayerView }[]> {
  const collection = await players()
  const [allPlayers, playedMatches] = await Promise.all([
    collection.find(onlyActive ? { active: true } : {}).sort({ name: 1 }).toArray(),
    (await matches()).find().sort({ playedAt: 1 }).toArray(),
  ])

  return allPlayers.map((player) => ({ player, view: toView(player, playedMatches) }))
}

export async function listPlayerViews(onlyActive: boolean): Promise<PlayerView[]> {
  return (await loadPlayers(onlyActive)).map(({ view }) => view)
}

export async function listAdminPlayers(): Promise<AdminPlayerView[]> {
  return (await loadPlayers(false)).map(({ player, view }) => ({
    ...view,
    pollOpen: player.pollOpen,
    active: player.active,
    ratingHistory: player.ratingHistory.map((change) => ({ ...change, at: change.at.toISOString() })),
  }))
}

export async function openPollPlayers(): Promise<{ id: string; name: string }[]> {
  const collection = await players()
  const open = await collection
    .find({ active: true, pollOpen: true })
    .sort({ name: 1 })
    .toArray()

  return open.map((player) => ({ id: player._id.toHexString(), name: player.name }))
}

export async function usableRatings(playerId: ObjectId): Promise<number[]> {
  const collection = await votes()
  const usable = await collection.find({ playerId, disregarded: false }).toArray()
  return usable.map((vote) => vote.rating)
}

export async function setLockedRating(
  playerId: ObjectId,
  to: number,
  source: RatingSource,
): Promise<void> {
  const collection = await players()
  const player = await collection.findOne({ _id: playerId })
  if (!player) throw new Error('Player not found')

  await collection.updateOne(
    { _id: playerId },
    {
      $set: { lockedRating: to },
      $push: { ratingHistory: { from: player.lockedRating, to, source, at: new Date() } },
    },
  )
}

export type VoteReviewRow = {
  id: string
  name: string
  pollOpen: boolean
  lockedRating: number
  votes: {
    id: string
    voterEmail: string
    rating: number
    disregarded: boolean
    updatedAt: string
  }[]
}

export async function listVotesByPlayer(): Promise<VoteReviewRow[]> {
  const [allPlayers, allVotes] = await Promise.all([
    (await players()).find().sort({ name: 1 }).toArray(),
    (await votes()).find().sort({ createdAt: 1 }).toArray(),
  ])

  return allPlayers.map((player) => ({
    id: player._id.toHexString(),
    name: player.name,
    pollOpen: player.pollOpen,
    lockedRating: player.lockedRating,
    votes: allVotes
      .filter((vote) => vote.playerId.equals(player._id))
      .map((vote) => ({
        id: vote._id.toHexString(),
        voterEmail: vote.voterEmail,
        rating: vote.rating,
        disregarded: vote.disregarded,
        updatedAt: vote.updatedAt.toISOString(),
      })),
  }))
}

export type MatchRow = {
  id: string
  playedAt: string
  winner: MatchWinner
  teamA: string[]
  teamB: string[]
}

export async function listMatchRows(): Promise<MatchRow[]> {
  const [allMatches, allPlayers] = await Promise.all([
    (await matches()).find().sort({ playedAt: -1 }).toArray(),
    (await players()).find().toArray(),
  ])

  const names = new Map(allPlayers.map((player) => [player._id.toHexString(), player.name]))
  const nameOf = (ids: typeof allMatches[number]['teamA']) =>
    ids.map((id) => names.get(id.toHexString()) ?? 'unknown')

  return allMatches.map((match) => ({
    id: match._id.toHexString(),
    playedAt: match.playedAt.toISOString(),
    winner: match.winner,
    teamA: nameOf(match.teamA),
    teamB: nameOf(match.teamB),
  }))
}
