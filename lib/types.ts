import { ObjectId } from 'mongodb'

export type Outcome = 'W' | 'L' | 'D'
export type Team = 'A' | 'B'
export type MatchWinner = Team | 'draw'
export type RatingSource = 'poll-close' | 'admin-edit' | 'revert'

export type RatingChange = {
  from: number
  to: number
  source: RatingSource
  at: Date
}

export type Player = {
  _id: ObjectId
  name: string
  lockedRating: number
  pollOpen: boolean
  active: boolean
  ratingHistory: RatingChange[]
  createdAt: Date
}

export type Vote = {
  _id: ObjectId
  playerId: ObjectId
  voterEmail: string
  rating: number
  disregarded: boolean
  createdAt: Date
  updatedAt: Date
}

export type Match = {
  _id: ObjectId
  playedAt: Date
  teamA: ObjectId[]
  teamB: ObjectId[]
  winner: MatchWinner
  createdAt: Date
}

export type PlayerView = {
  id: string
  name: string
  lockedRating: number
  weight: number
  form: Outcome[]
  wins: number
  losses: number
  draws: number
}

export type RatingChangeView = Omit<RatingChange, 'at'> & { at: string }

export type AdminPlayerView = PlayerView & {
  pollOpen: boolean
  active: boolean
  ratingHistory: RatingChangeView[]
}
