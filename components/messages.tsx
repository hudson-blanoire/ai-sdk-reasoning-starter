"use client";

import Markdown from "react-markdown";
import { markdownComponents } from "./markdown-components";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, SpinnerIcon } from "./icons";
import { useChat } from '@ai-sdk/react'
import { Message } from 'ai'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import { SearchSection } from './search-section'
import { UIRenderer } from './ui-renderer'
import { MessageLoading } from '@/components/ui/message-loading'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserRound, Bot } from 'lucide-react'

// Define a complete interface for tool invocations
interface ExtendedToolInvocation {
  id: string;
  toolName: string;
  toolCallId?: string;
  state: 'partial-call' | 'call' | 'result' | 'error';
  args: Record<string, unknown>;
  result?: unknown;
  error?: Error;
}

interface ReasoningPart {
  type: "reasoning";
  reasoning: string;
  details: Array<{ type: "text"; text: string }>;
}

interface ToolInvocationState {
  state: 'partial-call' | 'call' | 'result' | 'error';
  toolName: string;
  toolCallId: string;
  args: Record<string, any>;
  result?: any;
  error?: Error;
}

interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: ToolInvocationState;
}

interface TextPart {
  type: 'text';
  text: string;
}

interface StepStartPart {
  type: 'step-start';
}

interface SourcePart {
  type: 'source';
  source: {
    url: string;
    title?: string;
  };
}

type MessagePart = TextPart | ReasoningPart | ToolInvocationPart | StepStartPart | SourcePart;

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

            <Markdown components={markdownComponents}>{part.reasoning}</Markdown>
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
  openToolId?: string | null
  setOpenToolId?: (id: string | null) => void
  isPendingResponse?: boolean // Immediate feedback when user submits a prompt
}

export function Messages({ messages, status, openToolId: externalOpenToolId, setOpenToolId: externalSetOpenToolId, isPendingResponse = false }: MessagesProps) {
  // Use external state if provided, otherwise use internal state
  const [internalOpenToolId, setInternalOpenToolId] = useState<string | null>(null)
  
  // Use either the external or internal state
  const openToolId = externalOpenToolId !== undefined ? externalOpenToolId : internalOpenToolId
  const setOpenToolId = externalSetOpenToolId || setInternalOpenToolId
  const messagesRef = useRef<HTMLDivElement>(null)
  const messagesLength = useMemo(() => messages.length, [messages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messagesLength])

  return (
    <div className="flex flex-col overflow-y-auto w-full mb-4 pt-4 md:pt-6" ref={messagesRef}>
      {messages.map((message, index) => {
        // Handle user messages
        if (message.role === 'user') {
          return (
            <div
              key={`${message.role}-${index}`}
              className="flex items-start mb-8 gap-2 flex-row-reverse justify-start"
            >
              <Avatar className="mt-0.5 h-8 w-8">
                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                  <UserRound size={16} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-xl dark:bg-zinc-800 bg-zinc-100 py-2 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] whitespace-pre-wrap break-words">
                <p>{message.content}</p>
              </div>
            </div>
          )
        }

        // Handle assistant messages with proper parts handling
        return (
          <div key={`${message.role}-${index}`} className="mb-8 flex items-start gap-2">
            <Avatar className="mt-0.5 h-8 w-8">
              <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                <Bot size={16} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
            {/* Handle message parts - a more modern approach than looking at content */}
            {message.parts && (
              <div className="space-y-4">
                {(message.parts as MessagePart[]).map((part, index) => {
                  // Handle text parts
                  if (part.type === 'text') {
                    return (
                      <div 
                        key={`text-${index}`} 
                        className="flex flex-col items-start"
                      >
                        <div className="rounded-xl py-3 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] dark:bg-zinc-800 bg-zinc-100 whitespace-pre-wrap break-words">
                          <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            components={markdownComponents}
                            remarkPlugins={[
                              // Add custom remark plugin to handle exasearch and other custom components
                              () => (tree) => {
                                // This plugin does nothing but allows us to process the markdown later
                                return tree;
                              }
                            ]}
                            className="prose dark:prose-invert prose-zinc prose-sm sm:prose-base lg:prose-base max-w-none">
                          
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                  
                  // Handle step boundaries
                  if (part.type === 'step-start') {
                    return index > 0 ? (
                      <div key={`step-${index}`} className="text-gray-500">
                        <hr className="my-2 border-gray-300 dark:border-gray-700" />
                      </div>
                    ) : null;
                  }
                  
                  // Handle tool invocations
                  if (part.type === 'tool-invocation') {
                    const { toolInvocation } = part
                    
                    // Handle partial tool calls during streaming
                    if (toolInvocation.state === 'partial-call') {
                      return (
                        <div 
                          key={`partial-tool-${index}`}
                          className="flex flex-col items-start w-full"
                        >
                          <div className="rounded-xl py-3 px-4 dark:bg-zinc-800 bg-zinc-100 w-fit">
                            <div className="flex items-center space-x-3">
                              <MessageLoading />
                              <span className="text-sm font-medium">
                                {toolInvocation.toolName === 'exaSearch' 
                                  ? `Preparing search${toolInvocation.args?.query ? `: ${toolInvocation.args.query}` : '...'}` 
                                  : 'Processing request...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // If the tool is executing, show loading state
                    if (toolInvocation.state === 'call') {
                      return (
                        <div 
                          key={`tool-${index}`}
                          className="flex flex-col items-start w-full"
                        >
                          <div className="rounded-xl py-3 px-4 dark:bg-zinc-800 bg-zinc-100 w-fit">
                            <div className="flex items-center space-x-3">
                              <MessageLoading />
                              <span className="text-sm font-medium">
                                {toolInvocation.toolName === 'exaSearch' 
                                  ? `Searching for: ${toolInvocation.args.query}` 
                                  : 'Processing request...'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // If the tool has completed, show results using the UIRenderer
                    if (toolInvocation.state === 'result') {
                      return (
                        <div key={`tool-${index}`} className="w-full my-2">
                          <UIRenderer 
                            toolName={toolInvocation.toolName}
                            toolResult={toolInvocation.result}
                            toolCallId={toolInvocation.toolCallId}
                          />
                        </div>
                      )
                    }
                      
                    // Handle error state
                    if (toolInvocation.state === 'error') {
                      return (
                        <div 
                          key={`tool-${index}`}
                          className="flex flex-col items-start w-full"
                        >
                          <div className="rounded-xl py-2 px-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 w-fit">
                            <div className="flex items-center space-x-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                              <span>Error processing request: {toolInvocation.error ? (toolInvocation.error as Error)?.message : 'Unknown error'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  }
                  
                  // Handle source attribution
                  if (part.type === 'source') {
                    return (
                      <div 
                        key={`source-${index}`}
                        className="flex flex-col items-start"
                      >
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 ml-4 mt-1">
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
                  
                  return null;
                })}
              </div>
            )}
            
            {/* Always prioritize message.parts if it exists (even if empty) */}
            {message.parts ? null : message.content && (
              <div className="flex flex-col items-start">
                <div className="rounded-xl py-3 px-4 w-fit max-w-full sm:max-w-[85%] md:max-w-[75%] dark:bg-zinc-800 bg-zinc-100 whitespace-pre-wrap break-words">
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                    remarkPlugins={[
                      // Add custom remark plugin to handle exasearch and other custom components
                      () => (tree) => {
                        // This plugin does nothing but allows us to process the markdown later
                        return tree;
                      }
                    ]}
                    className="prose dark:prose-invert prose-zinc prose-sm sm:prose-base lg:prose-base max-w-none"
                  >
                    {typeof message.content === 'string' ? message.content : ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {/* Handle legacy tool invocations using the toolInvocations property - KEEP THIS FOR BACKWARD COMPATIBILITY */}
            {!message.parts && message.toolInvocations?.map((tool, toolIndex) => {
              if (tool.toolName === 'exaSearch') {
                return (
                  <SearchSection
                    key={`legacy-tool-${toolIndex}`}
                    tool={tool as ExtendedToolInvocation}
                    isOpen={openToolId === (tool as ExtendedToolInvocation).id}
                    onOpenChange={(open) => setOpenToolId(open ? (tool as ExtendedToolInvocation).id : null)}
                  />
                )
              }
              return null
            })}
            </div>
          </div>
        )
      })}

      {/* Show a thinking/loading indicator when streaming */}
      {(status === 'streaming' || isPendingResponse) && (
        <div className="flex items-start mb-8 gap-2">
          <Avatar className="mt-0.5 h-8 w-8">
            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
              <Bot size={16} strokeWidth={2} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="rounded-xl py-3 px-4 dark:bg-zinc-800 bg-zinc-100 w-fit flex items-center gap-3">
            <MessageLoading />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isPendingResponse ? "Processing..." : "Thinking..."}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
