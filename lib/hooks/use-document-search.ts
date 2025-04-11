import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Document } from '../chroma/documents';

interface DocumentSearchOptions {
  onError?: (error: Error) => void;
}

export function useDocumentSearch(options: DocumentSearchOptions = {}) {
  const { userId, isSignedIn } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all documents for the current user
  const fetchDocuments = useCallback(async () => {
    if (!userId || !isSignedIn) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, options.onError]);

  // Search documents based on a query
  const searchDocuments = useCallback(async (query: string, limit: number = 5) => {
    if (!userId || !isSignedIn || !query.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents?query=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to search documents');
      }
      
      const data = await response.json();
      const results = data.documents || [];
      setSearchResults(results);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, options.onError]);

  // Add a new document
  const addDocument = useCallback(async (
    title: string,
    content: string,
    url?: string,
    metadata?: Record<string, any>
  ) => {
    if (!userId || !isSignedIn) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          url,
          metadata,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add document');
      }
      
      const data = await response.json();
      await fetchDocuments(); // Refresh the documents list
      
      return data.documentId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, fetchDocuments, options.onError]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!userId || !isSignedIn) return false;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      await fetchDocuments(); // Refresh the documents list
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, fetchDocuments, options.onError]);

  return {
    documents,
    searchResults,
    isLoading,
    error,
    fetchDocuments,
    searchDocuments,
    addDocument,
    deleteDocument,
  };
}
