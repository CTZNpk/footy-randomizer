import { Collection, Db } from 'mongodb'
import connect from './mongodb'
import { Match, Player, Vote } from './types'

let indexesReady: Promise<void> | undefined

async function database(): Promise<Db> {
  const client = await connect()
  const db = client.db(process.env.MONGODB_DB)

  indexesReady ??= Promise.all([
    db.collection('votes').createIndex({ playerId: 1, voterEmail: 1 }, { unique: true }),
    db.collection('players').createIndex({ name: 1 }),
    db.collection('matches').createIndex({ playedAt: -1 }),
  ]).then(() => undefined)
  await indexesReady

  return db
}

export async function players(): Promise<Collection<Player>> {
  return (await database()).collection<Player>('players')
}

export async function votes(): Promise<Collection<Vote>> {
  return (await database()).collection<Vote>('votes')
}

export async function matches(): Promise<Collection<Match>> {
  return (await database()).collection<Match>('matches')
}
