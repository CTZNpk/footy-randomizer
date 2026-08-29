import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>
}

export default function connect(): Promise<MongoClient> {
  globalForMongo.mongoClientPromise ??= new MongoClient(process.env.MONGODB_URI!).connect()
  return globalForMongo.mongoClientPromise
}
