import { tool as createTool } from 'ai';
import { z } from 'zod';
import { retrieveContextForQuery } from './redis/rag';
import { getUserDocuments } from './redis/vector';

/**
 * File search tool for retrieving information from uploaded documents
 */
export const fileSearchTool = createTool({
  description: 'Search through uploaded documents and files for specific information. This tool is useful when you need to reference content from files that have been previously uploaded to the system.',
  parameters: z.object({
    query: z.string().describe('A clear, specific search query to find information in uploaded documents'),
    userId: z.string().describe('The ID of the user whose documents to search')
  }),
  execute: async ({ query, userId }) => {
    console.log(`Executing file search with query: "${query}" for user: ${userId}`);
    
    try {
      // Retrieve context information based on the query
      const { contextText, sources } = await retrieveContextForQuery(
        query,
        userId,
        5 // Increased max results for better context
      );
      
      // Handle case where no relevant documents are found
      if (!contextText || contextText.trim() === '' || sources.length === 0) {
        return {
          found: false,
          message: 'No relevant documents found for your query.',
          results: []
        };
      }
      
      // Format the sources for display
      const formattedSources = sources.map((source, index) => {
        // Truncate content if it's too long for display
        const content = source.content.length > 300 
          ? `${source.content.substring(0, 300)}...` 
          : source.content;
          
        return {
          title: source.title,
          snippet: content,
          url: source.url,
          index: index + 1
        };
      });
      
      return {
        found: true,
        message: `Found ${sources.length} relevant document(s)`,
        results: formattedSources,
        contextText
      };
    } catch (error) {
      console.error('Error searching files:', error);
      return {
        found: false,
        message: `Error searching files: ${error instanceof Error ? error.message : String(error)}`,
        results: []
      };
    }
  }
});

/**
 * List documents tool for browsing all uploaded documents
 */
export const listDocumentsTool = createTool({
  description: 'List all documents uploaded by a user. Use this to get an overview of available documents before searching for specific information.',
  parameters: z.object({
    userId: z.string().describe('The ID of the user whose documents to list')
  }),
  execute: async ({ userId }) => {
    console.log(`Listing documents for user: ${userId}`);
    
    try {
      // Get all documents for the user
      const documents = await getUserDocuments(userId);
      
      // Handle case where no documents are found
      if (!documents || documents.length === 0) {
        return {
          found: false,
          message: 'No documents found for this user.',
          documents: []
        };
      }
      
      // Group documents by their parent document ID to avoid duplicate listings
      const documentGroups = new Map();
      
      for (const doc of documents) {
        const documentId = doc.metadata?.documentId || doc.id;
        const filename = doc.metadata?.filename || 'Unknown';
        const fileType = doc.metadata?.fileType || 'Unknown';
        
        if (!documentGroups.has(documentId)) {
          documentGroups.set(documentId, {
            title: doc.title.split(' (Part')[0], // Remove part indicators
            filename,
            fileType,
            uploadDate: new Date(doc.createdAt).toISOString(),
            chunkCount: 1
          });
        } else {
          // Increment chunk count for existing document
          const existing = documentGroups.get(documentId);
          existing.chunkCount += 1;
          documentGroups.set(documentId, existing);
        }
      }
      
      // Convert map to array for return
      const documentList = Array.from(documentGroups.entries()).map(([id, info]) => ({
        id,
        ...info
      }));
      
      return {
        found: true,
        message: `Found ${documentList.length} document(s)`,
        documents: documentList
      };
    } catch (error) {
      console.error('Error listing documents:', error);
      return {
        found: false,
        message: `Error listing documents: ${error instanceof Error ? error.message : String(error)}`,
        documents: []
      };
    }
  }
});

// Export file document tools
export const fileTools = {
  fileSearch: fileSearchTool,
  listDocuments: listDocumentsTool
};

// Export types for tool usage
export type FileSearchToolCall = typeof fileSearchTool;
export type ListDocumentsToolCall = typeof listDocumentsTool;
