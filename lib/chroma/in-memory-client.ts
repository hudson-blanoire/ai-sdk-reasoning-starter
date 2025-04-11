import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddingFunction } from 'chromadb';

/**
 * Create and initialize an in-memory ChromaDB client
 * This is useful for development and testing
 */
let chromaInMemoryClient: ChromaClient | null = null;

/**
 * Get a singleton instance of the in-memory ChromaDB client
 */
export async function getInMemoryChromaClient(): Promise<ChromaClient> {
  if (!chromaInMemoryClient) {
    // Check if OpenAI API key is available
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      throw new Error('OpenAI API key is required for embeddings');
    }

    // Create embedding function using OpenAI
    const embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: openAIKey,
      openai_model: 'text-embedding-3-small'
    });
    
    // Initialize ChromaDB client in memory
    console.log('Initializing in-memory ChromaDB client');
    chromaInMemoryClient = new ChromaClient({
      path: './chroma-data' // Use a local persistent directory
    });
    
    // Create a default collection with the embedding function
    const collection = await chromaInMemoryClient.createCollection({
      name: 'documents',
      embeddingFunction: embeddingFunction
    });
    
    console.log('In-memory ChromaDB client initialized with default collection');
  }
  
  return chromaInMemoryClient;
}
