import mongoose from 'mongoose';
import { CONFIG } from './constants';

let memoryServer: any = null;

export const connectDatabase = async (): Promise<string> => {
  try {
    // Attempt connecting to configured MONGODB_URI
    mongoose.set('strictQuery', false);
    
    // Set a short timeout for initial connection attempt so fallback is snappy
    const conn = await mongoose.connect(CONFIG.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] Connected to external MongoDB at ${conn.connection.host}:${conn.connection.port}`);
    return CONFIG.MONGODB_URI;
  } catch (err: any) {
    console.warn(`[Database] Could not connect to MongoDB URI (${CONFIG.MONGODB_URI}): ${err.message}`);
    console.log('[Database] Starting in-memory MongoDB server (zero external dependency mode)...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] Connected to in-memory MongoDB at ${memUri}`);
      return memUri;
    } catch (memErr: any) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};
