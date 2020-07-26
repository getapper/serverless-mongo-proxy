import { Cursor, Db, MongoClient } from 'mongodb';
import { Context } from 'aws-lambda';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

dotenvExpand(dotenv.config());

interface ProxyRequest {
  collectionName: string
  operation: string
  args: any[]
}

let mongoClient: MongoClient;
let db: Db;

export default async function(event: ProxyRequest, context: Context) {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!mongoClient) {
    try {
      mongoClient = await MongoClient.connect(process.env['MONGO_URI'], {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      });
      db = mongoClient.db(); // @TODO process.env['MONGO_DB_NAME'] ?
    } catch (e) {
      return {
        error: {
          message: 'Could not connect to the MongoDB server, make sure environment variable MONGO_URI is set.',
        },
      };
    }
  }

  try {
    const { collectionName, operation, args } = event;
    const result = await db.collection(collectionName)[operation](...args);
    if (result instanceof Cursor) {
      return result.toArray();
    }
    return result;
  } catch (e) {
    return {
      error: {
        name: e.constructor.name,
        message: e.message,
      },
    };
  }
}
