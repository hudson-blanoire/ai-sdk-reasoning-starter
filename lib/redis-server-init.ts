import { initializeRedis, getRedisClient, closeRedisConnection } from './redis';

let isRedisInitialized = false;

/**
 * Initialize Redis for server components
 * This ensures Redis is properly initialized before handling requests
 */
export async function initRedisServer() {
  if (isRedisInitialized) {
    return true;
  }

  try {
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
      console.warn('Redis configuration missing. Please set REDIS_HOST, REDIS_PORT, REDIS_USERNAME, and REDIS_PASSWORD in .env.local file.');
      return false;
    }

    console.log('Initializing Redis server connection...');
    await initializeRedis();
    isRedisInitialized = true;
    console.log('Redis server connection initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis server:', error);
    return false;
  }
}

/**
 * Clean up Redis resources when server shuts down
 * This should be called in appropriate shutdown hooks
 */
export async function shutdownRedisServer() {
  if (!isRedisInitialized) {
    return;
  }

  try {
    await closeRedisConnection();
    isRedisInitialized = false;
    console.log('Redis server connection closed');
  } catch (error) {
    console.error('Error shutting down Redis server:', error);
  }
}
