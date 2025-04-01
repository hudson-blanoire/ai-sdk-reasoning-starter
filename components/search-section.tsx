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

interface SearchSectionProps {
  tool: ToolInvocation
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchSection({
  tool,
  isOpen,
  onOpenChange
}: SearchSectionProps) {
  const { isLoading } = useChat({
    id: CHAT_ID
  })
  
  // Check tool state
  const isToolLoading = tool.state === 'call'
  const isToolError = tool.state === 'error'
  
  // Get tool results when available
  const searchResults = tool.state === 'result' ? tool.result : undefined
  
  // Extract query from tool args
  const query = tool.args?.query as string | undefined
  const includeDomains = tool.args?.includeDomains as string[] | undefined
  const includeDomainsString = includeDomains
    ? ` [${includeDomains.join(', ')}]`
    : ''

  const header = (
    <ToolArgsSection
      tool="search"
      number={searchResults?.results?.length}
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
    >
      {isToolError && (
        <Section>
          <div className="text-red-600 dark:text-red-400">
            Search error: {tool.error || 'An unknown error occurred'}
          </div>
        </Section>
      )}
      
      {/* Display images if available */}
      {searchResults &&
        searchResults.images &&
        searchResults.images.length > 0 && (
          <Section>
            <SearchResultsImageSection
              images={searchResults.images}
              query={query}
            />
          </Section>
        )}
        
      {/* Show skeleton when loading */}
      {isLoading && isToolLoading ? (
        <SearchSkeleton />
      ) : searchResults?.results ? (
        <Section title="Sources">
          <SearchResults results={searchResults.results} />
        </Section>
      ) : null}
    </CollapsibleMessage>
  )
}