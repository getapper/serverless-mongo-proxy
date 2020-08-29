import { Cursor, Db, MongoClient } from 'mongodb';
import Bson from 'bson';
import { Context } from 'aws-lambda';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

dotenvExpand(dotenv.config());

interface ProxyRequest {
  collectionName: string
  operation: string
  args: any[]
}

interface ProxyResponse {
  responseBufferValues?: number[]
  error?: string
}

interface Event {
  requestBufferValues: number[]
}

let mongoClient: MongoClient;
let db: Db;

export default async function(event: Event, context: Context): Promise<ProxyResponse> {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!mongoClient) {
    try {
      mongoClient = await MongoClient.connect(process.env['MONGO_URI'], {
        useUnifiedTopology: true,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      });
      const dbName = process.env['MONGO_DB_NAME'];
      db = dbName ? mongoClient.db(dbName) : mongoClient.db();
    } catch (e) {
      console.error('Mongo connection', e);
      return { error: e.stack || e };
    }
  }

  let request: ProxyRequest;
  try {
    request = Bson.deserialize(Buffer.from(event.requestBufferValues));
  } catch (e) {
    console.error('Error on bson deserialize!', e);
    return { error: e.stack || e };
  }

  let result;
  try {
    const { collectionName, operation, args } = request;
    result = await db.collection(collectionName)[operation](...args);
    if (result instanceof Cursor) {
      result = await result.toArray();
    }
  } catch (e) {
    console.error('Error executing mongo query!', e);
    return { error: e.stack || e };
  }

  try {
    delete result?.connection;
    delete result?.message;

    return {
      responseBufferValues: Array.from(Bson.serialize({ result }).values()),
    };
  } catch (e) {
    console.error('Error on bson serialize!', e);
    return { error: e.stack || e };
  }
}
