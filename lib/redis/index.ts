// Export Redis client utilities
export * from './client';

// Export schema definitions
export * from './schema';

// Export index management
export * from './indices';

// Export session management
export * from './session';

// Export vector database operations
export * from './vector';

// Export embedding utilities
export * from './embeddings';

// Export RAG functionality
export * from './rag';

// Initialize function for Redis setup
import { getRedisClient } from './client';
import { createIndices } from './indices';

/**
 * Initialize Redis with all required indices
 * This should be called during application startup
 */
export async function initializeRedis(): Promise<void> {
  try {
    // Connect to Redis
    await getRedisClient();
    
    // Create indices
    await createIndices();
    
    console.log('Redis initialization completed successfully');
  } catch (error) {
    console.error('Error initializing Redis:', error);
    throw error;
  }
}
