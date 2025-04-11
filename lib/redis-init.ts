import { initializeRedis } from './redis';

/**
 * Initialize Redis database connection and required indices
 * This function should be called during application startup
 */
export async function setupRedisDatabase() {
  console.log('Setting up Redis database connection...');
  
  try {
    await initializeRedis();
    console.log('Redis database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis database:', error);
    return false;
  }
}

// Export a singleton initialize promise to prevent multiple initialization attempts
let initializePromise: Promise<boolean> | null = null;

export function getRedisInitPromise() {
  if (!initializePromise) {
    initializePromise = setupRedisDatabase();
  }
  return initializePromise;
}
