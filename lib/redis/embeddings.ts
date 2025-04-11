import { HfInference } from '@huggingface/inference';
import { OpenAI } from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Hugging Face inference (as an alternative)
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Generate embeddings using OpenAI's embeddings API
 * @param text Text to generate embedding for
 * @returns Number array representing the embedding vector
 */
export async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating OpenAI embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings using Hugging Face (fallback option)
 * @param text Text to generate embedding for
 * @returns Number array representing the embedding vector
 */
export async function generateHuggingFaceEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-mpnet-base-v2',
      inputs: text
    });
    
    // Handle different response types from Hugging Face
    if (Array.isArray(response)) {
      // If it's already an array of numbers, return it
      if (typeof response[0] === 'number') {
        return response as number[];
      }
      // If it's an array of arrays, flatten or take the first one
      if (Array.isArray(response[0])) {
        return response[0] as number[];
      }
    } else if (typeof response === 'number') {
      // Single number response
      return [response];
    }
    
    // Fallback - convert to string and parse
    console.warn('Unexpected embedding format, attempting to convert');
    const stringified = JSON.stringify(response);
    const parsed = JSON.parse(stringified);
    return Array.isArray(parsed) ? parsed : [0]; // Provide fallback empty embedding
  } catch (error) {
    console.error('Error generating Hugging Face embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding with fallback mechanism
 * @param text Text to generate embedding for
 * @returns Embedding vector as number array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // First try OpenAI
    return await generateOpenAIEmbedding(text);
  } catch (error) {
    console.warn('OpenAI embedding generation failed, falling back to Hugging Face');
    // Fallback to Hugging Face
    return await generateHuggingFaceEmbedding(text);
  }
}

/**
 * Split long text into chunks suitable for embedding
 * @param text Long text to chunk
 * @param maxChunkSize Maximum size of each chunk
 * @param overlap Overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string, 
  maxChunkSize: number = 1000, 
  overlap: number = 200
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let index = 0;
  
  while (index < text.length) {
    // Get chunk of specified size
    let chunk = text.substring(index, index + maxChunkSize);
    
    // If we're not at the end and didn't hit a natural break, try to find one
    if (index + maxChunkSize < text.length && !chunk.endsWith('.') && !chunk.endsWith('\n')) {
      // Find the last sentence break or newline
      const lastSentence = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf('\n'));
      
      if (lastSentence !== -1 && lastSentence > maxChunkSize / 2) {
        // If we found a good break point, use it
        chunk = chunk.substring(0, lastSentence + 1);
      }
    }
    
    chunks.push(chunk);
    
    // Move index forward, accounting for overlap
    index += chunk.length - overlap;
    
    // Ensure we're making progress
    if (chunk.length <= overlap) {
      index += overlap;
    }
  }
  
  return chunks;
}
