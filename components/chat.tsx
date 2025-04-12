"use client";

import cn from "classnames";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { Messages } from "./messages";
import { modelID, models } from "@/lib/models";
import { Footnote } from "./footnote";
import {
  ArrowUpIcon,
  CheckedSquare,
  ChevronDownIcon,
  StopIcon,
  UncheckedSquare,
} from "./icons";
import { Input } from "./input";
import { CHAT_ID } from "@/lib/constants";

export function Chat() {
  const [input, setInput] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<modelID>("sonnet-3.7");
  const [isReasoningEnabled, setIsReasoningEnabled] = useState<boolean>(false);
  const [isAgenticEnabled, setIsAgenticEnabled] = useState<boolean>(false);

  // Load model preference from localStorage if available
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel && models[savedModel as modelID]) {
      setSelectedModelId(savedModel as modelID);
    }
    
    const savedReasoning = localStorage.getItem("isReasoningEnabled");
    if (savedReasoning) {
      setIsReasoningEnabled(savedReasoning === "true");
    }
    
    const savedAgentic = localStorage.getItem("isAgenticEnabled");
    if (savedAgentic) {
      setIsAgenticEnabled(savedAgentic === "true");
    }
  }, []);

  // Save preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModelId);
    localStorage.setItem("isReasoningEnabled", String(isReasoningEnabled));
    localStorage.setItem("isAgenticEnabled", String(isAgenticEnabled));
  }, [selectedModelId, isReasoningEnabled, isAgenticEnabled]);

  const { messages, append, status, stop } = useChat({
    id: CHAT_ID,
    body: {
      selectedModelId,
      isReasoningEnabled,
      isAgenticEnabled
    },
    onError: () => {
      toast.error("An error occurred, please try again!");
    },
    maxSteps: 3, // Allow multiple steps for handling tool calls
  });

  const isGeneratingResponse = ["streaming", "submitted"].includes(status);

  // Handle mutual exclusivity between reasoning and agentic modes
  const handleReasoningToggle = () => {
    if (isReasoningEnabled) {
      setIsReasoningEnabled(false);
    } else {
      setIsReasoningEnabled(true);
      setIsAgenticEnabled(false);
    }
  };

  const handleAgenticToggle = () => {
    if (isAgenticEnabled) {
      setIsAgenticEnabled(false);
    } else {
      setIsAgenticEnabled(true);
      setIsReasoningEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-3xl mx-auto flex flex-col h-full">
        <div className="flex-grow overflow-y-auto px-4">
          {messages.length > 0 ? (
            <Messages messages={messages} status={status} />
          ) : (
            <div className="flex flex-col gap-6 h-full justify-center">
              <div className="flex flex-col gap-0.5 sm:text-2xl text-xl">
                <div className="flex flex-row gap-2 items-center">
                  <div>Welcome to Atoma</div>
                </div>
                <div className="dark:text-zinc-500 text-zinc-400">
                  What can we innovate today.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-container mt-8 mb-8">
          <div className="w-full relative p-3 dark:bg-zinc-800 rounded-2xl flex flex-col gap-1 bg-zinc-100 shadow-lg">
            <Input
              input={input}
              setInput={setInput}
              selectedModelId={selectedModelId}
              isGeneratingResponse={isGeneratingResponse}
              isReasoningEnabled={isReasoningEnabled}
            />

            <div className="absolute bottom-2.5 left-2.5 flex gap-2">
              <button
                disabled={selectedModelId !== "sonnet-3.7"}
                className={cn(
                  "relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-2 dark:hover:bg-zinc-600 hover:bg-zinc-200 cursor-pointer disabled:opacity-50",
                  {
                    "dark:bg-zinc-600 bg-zinc-200": isReasoningEnabled,
                  },
                )}
                onClick={handleReasoningToggle}
              >
                {isReasoningEnabled ? <CheckedSquare /> : <UncheckedSquare />}
                <div>Reasoning</div>
              </button>
              
              <button
                className={cn(
                  "relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-2 dark:hover:bg-zinc-600 hover:bg-zinc-200 cursor-pointer",
                  {
                    "dark:bg-zinc-600 bg-zinc-200": isAgenticEnabled,
                  },
                )}
                onClick={handleAgenticToggle}
              >
                {isAgenticEnabled ? <CheckedSquare /> : <UncheckedSquare />}
                <div>Agentic</div>
              </button>
            </div>

            <div className="absolute bottom-2.5 right-2.5 flex flex-row gap-2">
              <div className="relative w-fit text-sm p-1.5 rounded-lg flex flex-row items-center gap-0.5 dark:hover:bg-zinc-700 hover:bg-zinc-200 cursor-pointer">
                <div className="flex justify-center items-center text-zinc-500 dark:text-zinc-400 px-1">
                  <span className="pr-1">{models[selectedModelId]}</span>
                  <ChevronDownIcon />
                </div>

                <select
                  className="absolute opacity-0 w-full p-1 left-0 cursor-pointer"
                  value={selectedModelId}
                  onChange={(event) => {
                    const newModelId = event.target.value as modelID;
                    if (newModelId !== "sonnet-3.7") {
                      setIsReasoningEnabled(false);
                    }
                    setSelectedModelId(newModelId);
                  }}
                >
                  {Object.entries(models).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={cn(
                  "size-8 flex flex-row justify-center items-center dark:bg-zinc-100 bg-zinc-900 dark:text-zinc-900 text-zinc-100 p-1.5 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-300 hover:scale-105 active:scale-95 transition-all",
                  {
                    "dark:bg-zinc-200 dark:text-zinc-500":
                      isGeneratingResponse || input === "",
                  },
                )}
                onClick={() => {
                  if (input === "") {
                    return;
                  }

                  if (isGeneratingResponse) {
                    stop();
                  } else {
                    append({
                      role: "user",
                      content: input,
                      createdAt: new Date(),
                    });
                  }

                  setInput("");
                }}
              >
                {isGeneratingResponse ? <StopIcon /> : <ArrowUpIcon />}
              </button>
            </div>
          </div>

          <div className="text-center mt-2">
            <Footnote />
          </div>
        </div>
      </div>
    </div>
  );
}
