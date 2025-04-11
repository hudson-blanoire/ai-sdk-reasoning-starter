import { getRedisClient } from './client';
import { documentVectorIndexDefinition, sessionIndexDefinition, messageIndexDefinition } from './schema';

/**
 * Initialize Redis indices if they don't exist
 */
export async function initializeRedisIndices() {
  const client = await getRedisClient();
  
  try {
    // Create all required indices
    await createIndexIfNotExists(client, documentVectorIndexDefinition);
    await createIndexIfNotExists(client, sessionIndexDefinition);
    await createIndexIfNotExists(client, messageIndexDefinition);
    
    console.log('All Redis indices initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Redis indices:', error);
    return false;
  }
}

/**
 * Create a single Redis index if it doesn't already exist
 */
async function createIndexIfNotExists(client: any, indexDefinition: any) {
  const { indexName, prefix, schema } = indexDefinition;
  
  try {
    // Check if index already exists
    await client.ft.info(indexName);
    console.log(`Index ${indexName} already exists`);
  } catch (error) {
    // Index doesn't exist, proceed with creation
    console.log(`Creating index ${indexName}...`);
    
    try {
      // Create RedisSearch schema definition object
      const schemaDefinition: Record<string, any> = {};
      
      // Add each field to the schema
      for (const [fieldName, options] of Object.entries(schema)) {
        // @ts-ignore - RedisSearch schema types are complex
        schemaDefinition[fieldName] = options;
      }
      
      // Create the index
      await client.ft.create(
        indexName,
        schemaDefinition,
        {
          ON: 'HASH',
          PREFIX: prefix
        }
      );
      
      console.log(`Index ${indexName} created successfully`);
    } catch (createError) {
      console.error(`Error creating index ${indexName}:`, createError);
      throw createError;
    }
  }
}
