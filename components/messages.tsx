"use client";

import Markdown from "react-markdown";
import { markdownComponents } from "./markdown-components";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "./icons";
import { Message, ToolInvocation, useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { convertExaResultsToSearchResults } from '@/lib/types'
import { SearchSection } from './search-section'
import { CHAT_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  details: Array<{ type: "text"; text: string }>;
}

interface ReasoningMessagePartProps {
  part: ReasoningPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  useEffect(() => {
    if (!isReasoning) {
      setIsExpanded(false);
    }
  }, [isReasoning]);

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            <SpinnerIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            className={cn(
              "cursor-pointer rounded-full dark:hover:bg-zinc-800 hover:bg-zinc-200",
              {
                "dark:bg-zinc-800 bg-zinc-200": isExpanded,
              },
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm dark:text-zinc-400 text-zinc-600 flex flex-col gap-4 border-l pl-3 dark:border-zinc-800"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {part.details.map((detail, detailIndex) =>
              detail.type === "text" ? (
                <Markdown key={detailIndex} components={markdownComponents}>
                  {detail.text}
                </Markdown>
              ) : (
                "<redacted>"
              ),
            )}

            {/* <Markdown components={markdownComponents}>{reasoning}</Markdown> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TextMessagePartProps {
  text: string;
}

export function TextMessagePart({ text }: TextMessagePartProps) {
  return (
    <div className="flex flex-col gap-4">
      <Markdown components={markdownComponents}>{text}</Markdown>
    </div>
  );
}

export interface MessagesProps {
  messages: Message[]
  status: ReturnType<typeof useChat>['status']
}

export function Messages({ messages, status }: MessagesProps) {
  const [openToolId, setOpenToolId] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const messagesLength = useMemo(() => messages.length, [messages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messagesLength])

  return (
    <div className="flex flex-col overflow-y-auto w-full mb-4" ref={messagesRef}>
      {messages.map((message, index) => {
        // Handle user messages
        if (message.role === 'user') {
          return (
            <div
              key={`${message.role}-${index}`}
              className="flex flex-col items-end mb-8"
            >
              <div className="rounded-xl dark:bg-zinc-800 bg-zinc-100 py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] whitespace-pre-wrap break-words">
                <p>{message.content}</p>
              </div>
            </div>
          )
        }

        // Handle assistant messages with proper parts handling
        return (
          <div key={`${message.role}-${index}`} className="mb-8">
            {/* Handle message parts - a more modern approach than looking at content */}
            {message.parts && (
              <div className="space-y-4">
                {message.parts.map((part, partIndex) => {
                  // Handle text parts
                  if (part.type === 'text') {
                    return (
                      <div 
                        key={`text-${partIndex}`} 
                        className="flex flex-col items-start"
                      >
                        <div className="rounded-xl py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] dark:bg-zinc-800 bg-zinc-100 whitespace-pre-wrap break-words">
                          <ReactMarkdown
                            rehypePlugins={[rehypeRaw as any]}
                            components={markdownComponents}
                            className="prose dark:prose-invert prose-zinc prose-sm sm:prose-base max-w-none"
                          >
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                  
                  // Handle tool invocations
                  if (part.type === 'tool-invocation') {
                    const { toolInvocation } = part
                    
                    // Special case for search tools
                    if (toolInvocation.toolName === 'exaSearch') {
                      // If the tool is still executing, show loading state
                      if (toolInvocation.state === 'call') {
                        return (
                          <div 
                            key={`tool-${partIndex}`}
                            className="flex flex-col items-start"
                          >
                            <div className="rounded-xl py-2 px-4 dark:bg-zinc-800 bg-zinc-100 w-fit">
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin h-4 w-4 border-2 border-zinc-500 rounded-full border-t-transparent"></div>
                                <span>Searching for: {toolInvocation.args.query}...</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      
                      // If the tool has completed, show results
                      if (toolInvocation.state === 'result') {
                        return (
                          <SearchSection
                            key={`tool-${partIndex}`}
                            tool={toolInvocation}
                            isOpen={openToolId === toolInvocation.id}
                            onOpenChange={(open) => setOpenToolId(open ? toolInvocation.id : null)}
                          />
                        )
                      }
                      
                      // Handle error state
                      if (toolInvocation.state === 'error') {
                        return (
                          <div 
                            key={`tool-${partIndex}`}
                            className="flex flex-col items-start"
                          >
                            <div className="rounded-xl py-2 px-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 w-fit">
                              <p>Error searching: {toolInvocation.error || 'Unknown error'}</p>
                            </div>
                          </div>
                        )
                      }
                    }
                  }
                  
                  // Handle source attribution
                  if (part.type === 'source') {
                    return (
                      <div 
                        key={`source-${partIndex}`}
                        className="flex flex-col items-start"
                      >
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-4">
                          Source: <a 
                            href={part.source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {part.source.title || part.source.url}
                          </a>
                        </div>
                      </div>
                    )
                  }
                  
                  return null
                })}
              </div>
            )}
            
            {/* Handle old-style content for backward compatibility */}
            {!message.parts && message.content && (
              <div className="flex flex-col items-start">
                <div className="rounded-xl py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] dark:bg-zinc-800 bg-zinc-100 whitespace-pre-wrap break-words">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw as any]}
                    components={markdownComponents}
                    className="prose dark:prose-invert prose-zinc prose-sm sm:prose-base max-w-none"
                  >
                    {typeof message.content === 'string' ? message.content : ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {/* Handle legacy tool invocations using the toolInvocations property */}
            {message.toolInvocations?.map((tool, toolIndex) => {
              if (tool.toolName === 'exaSearch') {
                return (
                  <SearchSection
                    key={`legacy-tool-${toolIndex}`}
                    tool={tool}
                    isOpen={openToolId === tool.id}
                    onOpenChange={(open) => setOpenToolId(open ? tool.id : null)}
                  />
                )
              }
              return null
            })}
          </div>
        )
      })}

      {/* Show a typing indicator when streaming */}
      {status === 'streaming' && (
        <div className="rounded-xl py-2 px-4 dark:bg-zinc-800 bg-zinc-100 w-fit mb-8">
          <div className="flex gap-1.5">
            <div className="dark:bg-zinc-500 bg-zinc-400 animate-pulse w-1.5 h-1.5 rounded-full"></div>
            <div className="dark:bg-zinc-500 bg-zinc-400 animate-pulse animation-delay-200 w-1.5 h-1.5 rounded-full"></div>
            <div className="dark:bg-zinc-500 bg-zinc-400 animate-pulse animation-delay-400 w-1.5 h-1.5 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  )
}
