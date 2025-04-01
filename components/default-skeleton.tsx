'use client'

import React from 'react'

export function SearchSkeleton() {
  return (
    <div className="w-full">
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
        
        {/* Result items skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col space-y-2 p-3 border rounded-lg">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
              <div className="flex mt-2 items-center space-x-2">
                <div className="rounded-full h-4 w-4 bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 