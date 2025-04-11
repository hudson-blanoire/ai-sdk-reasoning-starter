import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function NewChatButton() {
  return (
    <Link href="/" className="w-full">
      <Button className="group relative overflow-hidden w-full text-sm py-2 px-4 bg-black hover:bg-black/90 text-white h-10">
        <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
          New Chat
        </span>
        <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-white/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
          <Plus size={18} strokeWidth={2} aria-hidden="true" className="text-white" />
        </i>
      </Button>
    </Link>
  );
}
