import mongoose from 'mongoose';

/**
 * Simple mongoose connection helper used on the server side only. If no
 * MONGODB_URI environment variable is set, this will throw during the first
 * call so that build failures are obvious.
 *
 * Because the TallmanDashboard runs mostly on SQLite and external SQL Server
 * connections, MongoDB is purely used for the auth prototype. Keeping this
 * helper minimal avoids bringing the full mongoose library into any client
 * bundles.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // We keep the warning loud so that environments without Mongo configured
  // still build, but any runtime call will immediately explode and be obvious.
  console.warn('[mongoose] MONGODB_URI is not defined – mongoose.connect() will fail if invoked.');
}

// Global caching is extremely important in Next.js so that multiple
// hot-reloads in development don’t create new socket connections every time.
interface MongooseGlobalCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalCache = (globalThis as unknown as { __MONGOOSE__: MongooseGlobalCache }).__MONGOOSE__ || {
  conn: null,
  promise: null,
};

if (!(globalThis as any).__MONGOOSE__) {
  (globalThis as any).__MONGOOSE__ = globalCache;
}

export async function connect() {
  if (globalCache.conn) return globalCache.conn;
  if (!globalCache.promise) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }
    globalCache.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

export default mongoose;
