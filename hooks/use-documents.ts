import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Document } from '@/lib/chroma/documents';

interface UseDocumentsProps {
  initialDocuments?: Document[];
}

export function useDocuments({ initialDocuments = [] }: UseDocumentsProps = {}) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useUser();

  /**
   * Fetch all documents for the current user
   */
  const fetchDocuments = async () => {
    if (!isSignedIn) {
      setError('You must be signed in to access documents');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents);
      return data.documents;
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search documents based on semantic similarity
   */
  const searchDocuments = async (query: string, limit = 5) => {
    if (!isSignedIn) {
      setError('You must be signed in to search documents');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search documents');
      }
      
      const data = await response.json();
      return data.results;
    } catch (err) {
      console.error('Error searching documents:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a document by ID
   */
  const deleteDocument = async (documentId: string) => {
    if (!isSignedIn) {
      setError('You must be signed in to delete documents');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Update local state by removing the deleted document
      setDocuments(documents.filter(doc => doc.id !== documentId));
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new document
   */
  const addDocument = async (document: Omit<Document, 'id' | 'embedding' | 'createdAt' | 'updatedAt'>) => {
    if (!isSignedIn) {
      setError('You must be signed in to add documents');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add document');
      }
      
      const data = await response.json();
      
      // Refresh documents list after adding
      await fetchDocuments();
      
      return data.documentId;
    } catch (err) {
      console.error('Error adding document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    searchDocuments,
    deleteDocument,
    addDocument,
  };
}
