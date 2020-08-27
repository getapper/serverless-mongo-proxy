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

interface Event {
  bufferValues: string
}

let mongoClient: MongoClient;
let db: Db;

export default async function(event: Event, context: Context) {
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
      return {
        error: {
          message: 'Could not connect to the MongoDB server, make sure environment variable MONGO_URI is set.',
        },
      };
    }
  }

  let request: ProxyRequest;
  try {
    request = Bson.deserialize(Buffer.from(event.bufferValues));
  } catch (e){
    return {
      error: {
        message: `Error on bson serialize! ${e}`,
      },
    };
  }

  let result;
  try {
    const { collectionName, operation, args } = request;
    result = await db.collection(collectionName)[operation](...args);
    if (result instanceof Cursor) {
      result = await result.toArray();
    }
  } catch (e) {
    return {
      error: {
        name: e.constructor.name,
        message: e.message,
      },
    };
  }

  try {
    delete result?.connection;
    delete result?.message;

    const resultBuffer = Bson.serialize({ result });
    return Array.from(resultBuffer.values());
  } catch (e) {
    return {
      error: {
        message: `Error on bson serialize! ${e}`,
      },
    };
  }
}
