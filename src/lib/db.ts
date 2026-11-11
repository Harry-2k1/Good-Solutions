import mongoose from 'mongoose';

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define MONGODB_URI environment variable');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const READY_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export interface MongoStatus {
  connected: boolean;
  readyState: string;
  pingMs: number | null;
  host: string | null;
  port: number | null;
  database: string | null;
  error: string | null;
}

function redactMongoSecrets(message: string): string {
  return message.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)@/gi, '$1****@');
}

export async function getMongoStatus(): Promise<MongoStatus> {
  if (!process.env.MONGODB_URI) {
    return {
      connected: false,
      readyState: 'unconfigured',
      pingMs: null,
      host: null,
      port: null,
      database: null,
      error: 'MONGODB_URI is not set',
    };
  }

  try {
    await connectDB();
    const pingStart = Date.now();
    await mongoose.connection.db?.admin().command({ ping: 1 });
    const pingMs = Date.now() - pingStart;

    return {
      connected: mongoose.connection.readyState === 1,
      readyState: READY_STATES[mongoose.connection.readyState] ?? String(mongoose.connection.readyState),
      pingMs,
      host: mongoose.connection.host || null,
      port: mongoose.connection.port || null,
      database: mongoose.connection.name || null,
      error: null,
    };
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    return {
      connected: false,
      readyState: READY_STATES[mongoose.connection.readyState] ?? 'error',
      pingMs: null,
      host: mongoose.connection.host || null,
      port: mongoose.connection.port || null,
      database: mongoose.connection.name || null,
      error: redactMongoSecrets(
        error instanceof Error ? error.message : 'Failed to connect to MongoDB'
      ),
    };
  }
}
