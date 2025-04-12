'use client'

import { CHAT_ID } from '@/lib/constants'
import type { SearchResults as TypeSearchResults } from '@/lib/types'
import { ToolInvocation } from 'ai'
import { useChat } from '@ai-sdk/react'
import { CollapsibleMessage } from './collapsible-message'
import { SearchSkeleton } from './default-skeleton'
import { SearchResults } from './search-results'
import { SearchResultsImageSection } from './search-results-image'
import { Section, ToolArgsSection } from './section'
import { Search } from 'lucide-react'

interface SearchSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange,
  className = ''
}: SearchSectionProps) {
  const { isLoading } = useChat({
    id: CHAT_ID
  })
  
  // Check tool state
  const isToolLoading = tool.state === 'call'
  const isToolError = tool.state === 'error' as any // Type assertion to avoid TypeScript error
  
  // Get tool results when available
  const searchResults = tool.state === 'result' ? tool.result : undefined
  
  // Extract query from tool args
  const query = tool.args?.query as string | undefined
  const includeDomains = tool.args?.includeDomains as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  // Show the search query in the header with a search icon
  const header = (
    <ToolArgsSection
      tool="search"
      number={searchResults?.results?.length}
      icon={<Search className="h-4 w-4 mr-2 text-primary" />}
    >{`${query}${includeDomainsString}`}</ToolArgsSection>
  )

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={true}
      header={header}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showIcon={false}
      className={className}
    >
      {isToolError && (
        <Section>
          <div className="text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="font-medium mb-1">Search error</p>
            <p className="text-sm">{(tool as any).error || 'An unknown error occurred'}</p>
          </div>
        </Section>
      )}
      
      {/* Display images if available */}
      {searchResults &&
        searchResults.images &&
        searchResults.images.length > 0 && (
          <Section title="Images">
            <SearchResultsImageSection
              images={searchResults.images}
              query={query}
            />
          </Section>
        )}
        
      {/* Show skeleton when loading */}
      {isLoading && isToolLoading ? (
        <div className="mt-2">
          <SearchSkeleton />
        </div>
      ) : searchResults?.results ? (
        <>
          <Section title="Sources" className="mt-2">
            <SearchResults results={searchResults.results} />
          </Section>
          
          {/* Add sources attribution section */}
          <Section title="Attribution" className="mt-4">
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">Information sourced from:</p>
              <ul className="list-disc pl-5 space-y-1">
                {searchResults.results.slice(0, 5).map((result, index) => (
                  <li key={`source-${index}`}>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {result.title || result.url}
                    </a>
                    {result.publishedDate && (
                      <span className="ml-2 opacity-70">({new Date(result.publishedDate).toLocaleDateString()})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </>
      ) : null}
    </CollapsibleMessage>
  )
}