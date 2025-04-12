'use client';

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageLoading } from './message-loading';

export function CompletionDemo() {
  const { 
    completion, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    error, 
    stop 
  } = useCompletion({
    api: '/api/completion',
    // Throttle the completion and data updates to 50ms
    experimental_throttle: 50,
    onResponse: (response) => {
      console.log('Received response from server:', response);
    },
    onFinish: (message) => {
      console.log('Finished streaming message:', message);
    },
    onError: (error) => {
      console.error('An error occurred:', error);
    }
  });

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Text Completion Demo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your prompt here..."
              name="prompt"
              value={input}
              onChange={handleInputChange}
              rows={4}
              className="w-full resize-none"
            />
          </div>
          
          <div className="flex justify-between">
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Generate
            </Button>
            {isLoading && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={stop}
                className="text-red-500"
              >
                Stop Generation
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-900 min-h-[100px]">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <MessageLoading />
              <span className="text-sm text-gray-500">Generating response...</span>
            </div>
          ) : completion ? (
            <div className="whitespace-pre-wrap">{completion}</div>
          ) : (
            <p className="text-gray-500 italic">Completion will appear here</p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            <p className="text-sm font-medium">Error: {error.message}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Powered by Vercel AI SDK
      </CardFooter>
    </Card>
  );
}
