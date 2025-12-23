import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

if (!dbName) {
  throw new Error('MONGODB_DATABASE environment variable is not set');
}

// TypeScript now knows these are strings after the checks above
const mongoUri: string = uri;
const mongoDbName: string = dbName;

let client: MongoClient | null = null;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(mongoUri);
    await client.connect();
  }

  return client.db(mongoDbName);
}


