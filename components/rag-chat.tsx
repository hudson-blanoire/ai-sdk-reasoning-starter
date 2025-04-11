'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RotateCcw, Loader } from 'lucide-react';
import { FileUpload } from './file-upload';
import { useUser } from '@clerk/nextjs';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';

/**
 * RAG-enabled chat interface component
 */
export function RagChat() {
  const { user, isSignedIn } = useUser();
  const [showSources, setShowSources] = useState(true);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat with Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    error,
  } = useChat({
    api: '/api/rag',
    onResponse: (response) => {
      // Extract sources from response headers if available
      const sourcesHeader = response.headers.get('x-sources');
      if (sourcesHeader) {
        try {
          const sources = JSON.parse(sourcesHeader);
          // Store sources in session storage or state management
          sessionStorage.setItem('last-rag-sources', JSON.stringify(sources));
        } catch (e) {
          console.error('Error parsing sources:', e);
        }
      }
    },
  });

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Function to reset the chat
  const handleReset = () => {
    if (confirm('Are you sure you want to reset the conversation?')) {
      window.location.reload();
    }
  };

  // Get sources from session storage
  const [sources, setSources] = useState<any[]>([]);
  useEffect(() => {
    const storedSources = sessionStorage.getItem('last-rag-sources');
    if (storedSources) {
      try {
        setSources(JSON.parse(storedSources));
      } catch (e) {
        console.error('Error parsing stored sources:', e);
      }
    }
  }, [messages]);

  // Render authentication message if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Bot size={48} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to Use RAG Chat</h2>
        <p className="text-gray-500 max-w-md">
          Please sign in to upload documents and use the RAG-enabled chat functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        <div className="md:col-span-2 flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 mb-4" ref={messageContainerRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bot size={48} className="text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">RAG-Enabled AI Chat</h2>
                <p className="text-gray-500 max-w-md">
                  Upload documents and ask questions about their content. The AI will respond based on the information in your documents.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-tl-lg rounded-tr-none'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tr-lg rounded-tl-none'
                      } rounded-bl-lg rounded-br-lg p-3`}
                    >
                      <div className="mr-2 mt-1">
                        {message.role === 'user' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      <div className="prose dark:prose-invert max-w-none overflow-auto">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-3 flex items-center text-gray-500 dark:text-gray-400">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Generating response...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2 mb-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                className="w-full border border-gray-200 dark:border-gray-800 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-950"
                placeholder="Ask a question about your documents..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 rounded-lg p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg p-3 text-gray-700 dark:text-gray-300 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-3">Document Upload</h2>
            <FileUpload />
          </div>

          {sources.length > 0 && showSources && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-3">Sources</h2>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium">{source.title}</div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs"
                      >
                        {source.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
