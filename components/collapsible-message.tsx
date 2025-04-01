'use client'

import React from 'react'
import { Message } from '@ai-sdk/react'
import { ChevronDownIcon, ChevronUpIcon } from './icons'

interface CollapsibleMessageProps {
  role: Message['role']
  isCollapsible: boolean
  header: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  showIcon?: boolean
}

export function CollapsibleMessage({
  role,
  isCollapsible,
  header,
  isOpen,
  onOpenChange,
  children,
  showIcon = true
}: CollapsibleMessageProps) {
  return (
    <div className="flex flex-row w-full py-2 px-4 rounded-xl dark:bg-zinc-800 bg-zinc-100">
      <div className="flex flex-col w-full">
        <div 
          className={`flex items-start justify-between ${isCollapsible ? 'cursor-pointer' : ''}`}
          onClick={() => isCollapsible && onOpenChange(!isOpen)}
        >
          <div className="flex-1">{header}</div>
          {isCollapsible && (
            <div className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
              {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
          )}
        </div>
        {isOpen && <div className="pt-4">{children}</div>}
      </div>
    </div>
  )
} 