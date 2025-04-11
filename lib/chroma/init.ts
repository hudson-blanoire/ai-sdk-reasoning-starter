import { ChromaClient } from 'chromadb';
import { getInMemoryChromaClient } from './in-memory-client';

/**
 * Initialize the ChromaDB client and create any required collections
 * This should be called during application startup
 */
export async function initializeChromaDB(): Promise<boolean> {
  try {
    console.log('Initializing ChromaDB...');
    
    // Check environment variables
    const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
    const openAIKey = process.env.OPENAI_API_KEY;
    const useInMemory = process.env.USE_IN_MEMORY_CHROMA === 'true';
    
    if (!openAIKey) {
      console.warn('OpenAI API key not configured. Vector embeddings will not work properly.');
      return false;
    }
    
    try {
      if (useInMemory) {
        // Use in-memory ChromaDB
        console.log('Using in-memory ChromaDB client');
        const inMemoryClient = await getInMemoryChromaClient();
        console.log('In-memory ChromaDB initialized successfully');
        return true;
      } else {
        // Use HTTP client
        console.log('Using HTTP ChromaDB client with URL:', chromaUrl);
        // Initialize ChromaDB client
        const client = new ChromaClient({
          path: chromaUrl
        });
        
        // Test connection
        try {
          const heartbeat = await client.heartbeat();
          console.log(`ChromaDB heartbeat: ${heartbeat}`);
          
          // List collections
          const collections = await client.listCollections();
          console.log(`Found ${collections.length} ChromaDB collections`);
          
          return true;
        } catch (error) {
          console.error('HTTP ChromaDB connection failed. Falling back to in-memory mode.');
          // Fall back to in-memory mode
          const inMemoryClient = await getInMemoryChromaClient();
          console.log('Fallback to in-memory ChromaDB successful');
          return true;
        }
      }
    } catch (error) {
      console.error('Error initializing ChromaDB:', error);
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize ChromaDB:', error);
    return false;
  }
}
