import { getRedisClient } from './client';
import { 
  sessionIndexDefinition, 
  messageIndexDefinition, 
  documentVectorIndexDefinition 
} from './schema';

/**
 * Creates all required Redis indices for the application
 */
export async function createIndices() {
  console.log('Creating Redis indices...');
  const client = await getRedisClient();
  
  try {
    // Create session index
    await createIndex(client, sessionIndexDefinition);
    
    // Create message index
    await createIndex(client, messageIndexDefinition);
    
    // Create document vector index
    await createIndex(client, documentVectorIndexDefinition);
    
    console.log('All Redis indices created successfully');
  } catch (error) {
    console.error('Error creating Redis indices:', error);
    throw error;
  }
}

/**
 * Creates a single Redis index if it doesn't exist
 */
async function createIndex(client: any, indexDefinition: any) {
  const { indexName, prefix, schema } = indexDefinition;
  
  try {
    // Check if index already exists
    try {
      await client.ft.info(indexName);
      console.log(`Index ${indexName} already exists`);
      return;
    } catch (error) {
      // Index doesn't exist, proceed with creation
      console.log(`Creating index ${indexName}...`);
    }
    
    // Define type for field options to resolve TypeScript errors
    type FieldOption = {
      type: string;
      sortable?: boolean;
      ALGORITHM?: string;
      TYPE?: string;
      DIM?: number;
      DISTANCE_METRIC?: string;
    };

    // Prepare fields array for index creation
    const fields = Object.entries(schema).map(([fieldName, fieldOptions]) => {
      // Type assertion to use the defined type
      const options = fieldOptions as FieldOption;
      
      // Special handling for vector fields
      if (options.type === 'VECTOR') {
        return {
          name: fieldName,
          type: options.type,
          ALGORITHM: options.ALGORITHM,
          TYPE: options.TYPE,
          DIM: options.DIM,
          DISTANCE_METRIC: options.DISTANCE_METRIC
        };
      }
      
      // Regular field
      return {
        name: fieldName,
        type: options.type,
        sortable: options.sortable || false
      };
    });
    
    // The fields need to be in a flat array format for the Redis search library
    // Each field is defined by a sequence of arguments [fieldName, fieldType, ...options]
    const schemaArgs = [];
    
    // Process each field and add it to the schema arguments
    for (const [fieldName, fieldOptions] of Object.entries(schema)) {
      const options = fieldOptions as FieldOption;
      
      // Add field name and type
      schemaArgs.push(fieldName, options.type);
      
      // Add SORTABLE flag if needed
      if (options.sortable) {
        schemaArgs.push('SORTABLE');
      }
      
      // Add vector-specific options if it's a vector field
      if (options.type === 'VECTOR') {
        if (options.ALGORITHM) schemaArgs.push('ALGORITHM', options.ALGORITHM);
        if (options.TYPE) schemaArgs.push('TYPE', options.TYPE);
        if (options.DIM) schemaArgs.push('DIM', options.DIM.toString());
        if (options.DISTANCE_METRIC) schemaArgs.push('DISTANCE_METRIC', options.DISTANCE_METRIC);
      }
    }
    
    // Use the lower-level createCommand approach to ensure correct parameter format
    await client.ft.create(
      indexName,
      {
        ON: 'HASH',
        PREFIX: prefix
      },
      schemaArgs
    );
    
    console.log(`Index ${indexName} created successfully`);
  } catch (error) {
    console.error(`Error creating index ${indexName}:`, error);
    throw error;
  }
}

/**
 * Deletes all indices for clean state
 * Warning: Use only for development/testing
 */
export async function dropIndices() {
  const client = await getRedisClient();
  
  try {
    await dropIndex(client, sessionIndexDefinition.indexName);
    await dropIndex(client, messageIndexDefinition.indexName);
    await dropIndex(client, documentVectorIndexDefinition.indexName);
    
    console.log('All Redis indices dropped successfully');
  } catch (error) {
    console.error('Error dropping Redis indices:', error);
    throw error;
  }
}

/**
 * Drops a single Redis index if it exists
 */
async function dropIndex(client: any, indexName: string) {
  try {
    await client.ft.dropIndex(indexName);
    console.log(`Index ${indexName} dropped successfully`);
  } catch (error) {
    console.log(`Index ${indexName} does not exist or could not be dropped`);
  }
}
