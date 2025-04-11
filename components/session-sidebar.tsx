"use client";

import { useState, useEffect } from 'react';
import { useSupabaseChat } from '@/lib/hooks/use-supabase-chat';
import { useAuth } from '@clerk/nextjs';
import { PlusIcon, Trash2Icon, MessageSquareIcon, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

export function SessionSidebar({ 
  currentSessionId, 
  onSessionSelect, 
  className = "" 
}: { 
  currentSessionId?: string; 
  onSessionSelect: (sessionId: string) => void;
  className?: string;
}) {
  const { userId, isSignedIn } = useAuth();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isOpen, setIsOpen] = useState(false); // For mobile sidebar toggle
  
  const { 
    sessions, 
    fetchSessions, 
    createSession, 
    deleteSession,
    isLoading 
  } = useSupabaseChat({
    onError: (error) => {
      toast.error(error.message || 'An error occurred');
    }
  });

  // Load sessions when user is authenticated
  useEffect(() => {
    if (userId && isSignedIn) {
      fetchSessions();
    }
  }, [userId, isSignedIn, fetchSessions]);

  // Create a new chat session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSessionTitle.trim()) {
      toast.error('Please enter a session title');
      return;
    }
    
    try {
      const sessionId = await createSession(newSessionTitle);
      if (sessionId) {
        toast.success('New session created');
        setNewSessionTitle('');
        setIsCreatingSession(false);
        onSessionSelect(sessionId);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  // Handle session deletion with confirmation
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent session selection when clicking delete
    
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      const success = await deleteSession(sessionId);
      if (success) {
        toast.success('Session deleted');
        // If this was the current session, we need to reset
        if (sessionId === currentSessionId) {
          // Find another session to select or create a new one
          const otherSession = sessions.find(s => s.id !== sessionId);
          if (otherSession) {
            onSessionSelect(otherSession.id);
          } else {
            // No other sessions, could create a default one here
          }
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button 
        className="fixed top-4 left-4 p-2 bg-white dark:bg-gray-900 rounded-md shadow-sm md:hidden z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:h-auto
        ${className}
      `}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sessions</h2>
            <button
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => setIsCreatingSession(true)}
            >
              <PlusIcon size={16} />
            </button>
          </div>
          
          {isCreatingSession ? (
            <form onSubmit={handleCreateSession} className="mb-4">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Session Title"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                            dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                              transition-colors flex-1"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSession(false)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md 
                              hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : null}
          
          <div className="flex-1 overflow-y-auto">
            {isLoading && sessions.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <MessageSquareIcon className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>No sessions yet</p>
                <p className="text-sm mt-1">Create one to get started</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li 
                    key={session.id}
                    className={`
                      p-3 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 
                      transition-colors flex justify-between items-start group
                      ${currentSessionId === session.id ? 'bg-blue-100 dark:bg-blue-900' : ''}
                    `}
                    onClick={() => onSessionSelect(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{session.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(session.updatedAt)}
                      </p>
                    </div>
                    <button
                      className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 
                                transition-opacity"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2Icon size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
