"use client";

import { Chat } from "@/components/chat";
import { markdownComponents } from "@/components/markdown-components";
import { SearchResults } from "@/components/search-results";
import { SearchSection } from "@/components/search-section";
// Sidebar will be implemented in Phase 5
// import { ChatSidebar } from "@/components/chat-sidebar";
import { useState } from "react";

export default function Home() {
  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full max-w-3xl px-4 h-full">
        <Chat />
      </div>
    </div>
  );
}
