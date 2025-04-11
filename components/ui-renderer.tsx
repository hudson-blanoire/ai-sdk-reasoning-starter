'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchResultItem } from '@/lib/types';
import { SearchSection } from './search-section';

interface UIRendererProps {
  toolName: string;
  toolResult: any;
  toolCallId: string;
}

export function UIRenderer({ toolName, toolResult, toolCallId }: UIRendererProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Render different UI components based on the tool type
  switch (toolName) {
    case 'exaSearch':
      return (
        <div className="w-full space-y-2">
          <SearchSection
            tool={{
              toolName,
              toolCallId,
              result: toolResult,
              state: 'result',
              args: { query: toolResult.query }
            }}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          />
          {/* Search results summary has been removed to prevent duplicate components */}
        </div>
      );

    // Default fallback for any other tool
    default:
      return (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tool Result: {toolName}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
  }
}
