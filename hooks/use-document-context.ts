import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useDocuments } from './use-documents';
import { Document } from '@/lib/chroma/documents';

interface UseDocumentContextProps {
  maxResults?: number;
}

/**
 * Custom hook for providing document context to chat interactions
 * Used to perform semantic searches and retrieve relevant document snippets
 */
export function useDocumentContext({ maxResults = 3 }: UseDocumentContextProps = {}) {
  const [relevantDocuments, setRelevantDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { isSignedIn } = useUser();
  const { searchDocuments } = useDocuments();

  /**
   * Find documents relevant to a user query
   */
  const findRelevantDocuments = useCallback(async (query: string): Promise<Document[]> => {
    if (!isSignedIn || !query.trim()) {
      return [];
    }

    setIsSearching(true);

    try {
      // Search for documents semantically similar to the query
      const results = await searchDocuments(query, maxResults);
      setRelevantDocuments(results);
      return results;
    } catch (error) {
      console.error('Error finding relevant documents:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [isSignedIn, searchDocuments, maxResults]);

  /**
   * Format relevant documents into a context string for the AI
   */
  const getContextString = useCallback((documents: Document[]): string => {
    if (!documents || documents.length === 0) {
      return '';
    }

    return documents.map((doc, index) => {
      return `[Document ${index + 1}] ${doc.title}\n${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? '...' : ''}`;
    }).join('\n\n');
  }, []);

  /**
   * Get context for a specific query and format it for the AI
   */
  const getQueryContext = useCallback(async (query: string): Promise<string> => {
    const docs = await findRelevantDocuments(query);
    return getContextString(docs);
  }, [findRelevantDocuments, getContextString]);

  return {
    relevantDocuments,
    isSearching,
    findRelevantDocuments,
    getContextString,
    getQueryContext
  };
}
