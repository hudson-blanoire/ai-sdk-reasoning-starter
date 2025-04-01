'use client'

import React from 'react'

interface SectionProps {
  title?: string
  children: React.ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col space-y-2 mt-2 mb-4">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

interface ToolArgsSectionProps {
  tool: string
  number?: number
  children: React.ReactNode
}

export function ToolArgsSection({
  tool,
  number,
  children
}: ToolArgsSectionProps) {
  return (
    <div className="flex items-center text-sm">
      <div className="dark:bg-zinc-800 bg-zinc-200 rounded-lg px-2 py-1 mr-2">
        {tool}
      </div>
      <div className="truncate">
        {children}
        {number !== undefined && (
          <span className="ml-1 text-zinc-500">{number} results</span>
        )}
      </div>
    </div>
  )
} 