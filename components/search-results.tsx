'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchResultItem } from '@/lib/types'
import Link from 'next/link'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export interface SearchResultsProps {
  results: SearchResultItem[]
}

export function SearchResults({ results }: SearchResultsProps) {
  // State to manage whether to display all results
  const [showAllResults, setShowAllResults] = useState(false)

  const handleViewMore = () => {
    setShowAllResults(true)
  }

  const displayedResults = showAllResults ? results : results.slice(0, 3)
  const additionalResultsCount = results.length > 3 ? results.length - 3 : 0
  
  // Format domain name for display
  const displayUrlName = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      return hostname.replace(/^www\./, '')
    } catch (e) {
      return url
    }
  }

  // Get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
    } catch (e) {
      return ''
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (e) {
      return dateString
    }
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No search results found
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {displayedResults.map((result, index) => (
        <Link 
          href={result.url} 
          key={`${result.url}-${index}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="no-underline"
        >
          <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={getFaviconUrl(result.url)}
                      alt={displayUrlName(result.url)}
                    />
                    <AvatarFallback className="text-xs">
                      {displayUrlName(result.url)[0]?.toUpperCase() || 'W'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {displayUrlName(result.url)}
                    {result.publishedDate && (
                      <span className="ml-1 opacity-70">• {formatDate(result.publishedDate)}</span>
                    )}
                  </span>
                </div>
                
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{result.title}</h4>
                
                {result.snippet && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {result.snippet}
                  </p>
                )}
              </div>
              
              <div className="flex items-center mt-2 text-xs text-primary opacity-80">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span>View source</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {!showAllResults && additionalResultsCount > 0 && (
        <div className="col-span-1 sm:col-span-2 text-center">
          <Button
            variant="outline"
            onClick={handleViewMore}
            className="mt-2 text-sm px-4 py-2"
          >
            Show {additionalResultsCount} more results
          </Button>
        </div>
      )}
    </div>
  )
}