import { createClient } from 'redis';

// Get Redis connection details from environment variables
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisUsername = process.env.REDIS_USERNAME || '';
const redisPassword = process.env.REDIS_PASSWORD || '';

// Singleton to maintain a single Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000; // 2 seconds

/**
 * Gets a Redis client instance, creating one if it doesn't exist
 */
export async function getRedisClient() {
  // If we're already in the process of connecting, wait for it to complete
  if (isConnecting) {
    // Wait for connection to be established
    let retries = 0;
    while (isConnecting && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      retries++;
    }
  }
  
  // Check if client exists and is connected
  if (redisClient?.isOpen) {
    reconnectAttempts = 0; // Reset reconnect attempts when successful
    return redisClient;
  }
  
  // Create new client if it doesn't exist or reconnect if disconnected
  try {
    isConnecting = true;
    
    // Close existing client if it exists but is not connected
    if (redisClient && !redisClient.isOpen) {
      try {
        await redisClient.quit().catch(() => {}); // Ignore errors on quit
      } catch (e) {
        console.log('Error while closing existing Redis client:', e);
      }
      redisClient = null;
    }
    
    // Create the Redis client with the provided connection details
    if (!redisClient) {
      redisClient = createClient({
        username: redisUsername,
        password: redisPassword,
        socket: {
          host: redisHost,
          port: redisPort,
          reconnectStrategy: (retries) => {
            // Exponential backoff with max delay
            const delay = Math.min(Math.pow(2, retries) * 100, 3000);
            return delay;
          }
        }
      });

      // Setup event handlers
      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      });
      
      // Handle reconnection events
      redisClient.on('reconnecting', () => {
        console.log(`Redis client reconnecting... (Attempt ${reconnectAttempts + 1})`);
      });
      
      redisClient.on('end', () => {
        console.log('Redis client connection closed');
      });
    }

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    
    // Implement reconnection logic with backoff
    reconnectAttempts++;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`Attempting to reconnect to Redis in ${RECONNECT_DELAY_MS}ms (Attempt ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));
      
      // Clear the client to force a new connection attempt
      redisClient = null;
      isConnecting = false;
      
      // Recursive call to try again
      return getRedisClient();
    } else {
      console.error(`Maximum Redis reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      throw error;
    }
  } finally {
    isConnecting = false;
  }
}

/**
 * Explicitly close the Redis client connection
 */
export async function closeRedisConnection() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
      // Force disconnect if quit fails
      await redisClient.disconnect().catch(e => console.error('Disconnect failed:', e));
    } finally {
      redisClient = null;
      reconnectAttempts = 0;
    }
  }
}
