import { ChromaClient } from 'chromadb';

let chromaClient: ChromaClient | null = null;


/**
 * Get a singleton instance of ChromaDB client
 */
export async function getChromaClient(): Promise<ChromaClient> {
  if (!chromaClient) {
    // Initialize the ChromaDB client
    // Use standard configuration
    chromaClient = new ChromaClient({
      path: process.env.CHROMADB_URL || 'http://localhost:8000'
    });
    
    console.log('ChromaDB client initialized with path:', process.env.CHROMADB_URL || 'http://localhost:8000');
  }
  return chromaClient;
}

/**
 * Generate embeddings using OpenAI API directly
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is required for embeddings');
  }
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }
  
  const result = await response.json();
  return result.data[0].embedding;
}

/**
 * Get or create a collection for a specific Clerk user
 * Each user has their own isolated collection
 */
export async function getUserCollection(clerkUserId: string, create = true) {
  const client = await getChromaClient();
  
  // Collection name with Clerk user ID to isolate user data
  const collectionName = `user_docs_${clerkUserId}`;
  
  try {
    // Try to get existing collection
    const collection = await client.getCollection({
      name: collectionName,
      embeddingFunction: {
        // Define an embedding function that will be used by ChromaDB
        generate: async (texts: string[]) => {
          // Generate embeddings for each text
          const embeddings = [];
          for (const text of texts) {
            const embedding = await generateEmbedding(text);
            embeddings.push(embedding);
          }
          return embeddings;
        }
      }
    });
    
    console.log(`Retrieved collection ${collectionName} for user ${clerkUserId}`);
    return collection;
  } catch (error) {
    // Collection doesn't exist, create if specified
    if (create) {
      console.log(`Creating new collection ${collectionName} for user ${clerkUserId}`);
      return await client.createCollection({
        name: collectionName,
        metadata: {
          clerkUserId,
          description: "User document embeddings for vector search"
        },
        embeddingFunction: {
          // Define an embedding function that will be used by ChromaDB
          generate: async (texts: string[]) => {
            // Generate embeddings for each text
            const embeddings = [];
            for (const text of texts) {
              const embedding = await generateEmbedding(text);
              embeddings.push(embedding);
            }
            return embeddings;
          }
        }
      });
    }
    throw error;
  }
}
