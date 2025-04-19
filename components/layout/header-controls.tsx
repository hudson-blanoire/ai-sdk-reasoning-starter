'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SignInButtonCustom } from '@/components/ui/sign-in-button';
import { SignUpButtonCustom } from '@/components/ui/sign-up-button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

// New component for left side of header
export function LeftHeaderControls() {
  const { state } = useSidebar();

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Trigger shown in top left corner only when sidebar is collapsed */}
      {state === 'collapsed' && <SidebarTrigger className="h-5 w-5" />}
    </div>
  );
}

export function HeaderControls() {
  return (
    <div className="flex flex-row items-center gap-2 shrink-0">
      <ThemeToggle />
      <SignedOut>
        <SignUpButtonCustom />
        <SignInButtonCustom />
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}

// Separate component for the trigger inside the sidebar, 
// although it might be cleaner to manage both within HeaderControls 
// or pass state down if needed elsewhere.
// For now, let's assume the layout structure handles placing this.
// We will render this conditionally from the layout later.

export function SidebarHeaderTrigger() {
  const { state } = useSidebar();

  // Trigger shown inside sidebar header only when sidebar is expanded
  return state === 'expanded' ? <SidebarTrigger className="h-4 w-4" /> : null;
} 