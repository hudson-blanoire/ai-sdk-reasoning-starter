import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Message } from '../supabase/messages';
import { Session } from '../supabase/session';

interface SupabaseChatOptions {
  sessionId?: string;
  initialMessages?: Message[];
  onError?: (error: Error) => void;
}

export function useSupabaseChat(options: SupabaseChatOptions = {}) {
  const { userId, isSignedIn } = useAuth();
  const [sessionId, setSessionId] = useState<string | undefined>(options.sessionId);
  const [messages, setMessages] = useState<Message[]>(options.initialMessages || []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all sessions for the current user
  const fetchSessions = useCallback(async () => {
    if (!userId || !isSignedIn) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, options.onError]);

  // Fetch messages for a specific session
  const fetchMessages = useCallback(async (sessionId: string) => {
    if (!userId || !isSignedIn || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, options.onError]);

  // Create a new session
  const createSession = useCallback(async (title: string) => {
    if (!userId || !isSignedIn) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      const newSessionId = data.sessionId;
      
      setSessionId(newSessionId);
      await fetchSessions(); // Refresh the sessions list
      
      return newSessionId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, fetchSessions, options.onError]);

  // Add a message to the current session
  const addMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ) => {
    if (!userId || !isSignedIn || !sessionId) return null;

    setIsLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          role,
          content,
          metadata,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add message');
      }
      
      const data = await response.json();
      const newMessage: Message = {
        id: data.messageId,
        sessionId,
        role,
        content,
        createdAt: Date.now(),
        metadata,
      };
      
      setMessages(prev => [...prev, newMessage]);
      return data.messageId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, sessionId, options.onError]);

  // Delete a session
  const deleteSession = useCallback(async (sessionIdToDelete: string) => {
    if (!userId || !isSignedIn) return false;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/sessions?id=${sessionIdToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // If we deleted the current session, clear it
      if (sessionId === sessionIdToDelete) {
        setSessionId(undefined);
        setMessages([]);
      }
      
      await fetchSessions(); // Refresh the sessions list
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, isSignedIn, sessionId, fetchSessions, options.onError]);

  // Load a session by ID
  const loadSession = useCallback(async (sessionIdToLoad: string) => {
    if (!userId || !isSignedIn) return false;

    setSessionId(sessionIdToLoad);
    await fetchMessages(sessionIdToLoad);
    return true;
  }, [userId, isSignedIn, fetchMessages]);

  // Load sessions on mount and when userId changes
  useEffect(() => {
    if (userId && isSignedIn) {
      fetchSessions();
      
      // If we have a sessionId, load its messages
      if (sessionId) {
        fetchMessages(sessionId);
      }
    }
  }, [userId, isSignedIn, sessionId, fetchSessions, fetchMessages]);

  return {
    sessions,
    messages,
    sessionId,
    isLoading,
    error,
    fetchSessions,
    fetchMessages,
    createSession,
    addMessage,
    deleteSession,
    loadSession,
    setSessionId,
  };
}
