import { Toaster } from 'sonner';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ClerkProvider, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Home, Settings } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  HeaderControls, 
  SidebarHeaderTrigger, 
  LeftHeaderControls 
} from '@/components/layout/header-controls';

import './globals.css';
import { DeployButton } from '@/components/deploy-button';
import { StarButton } from '@/components/star-button';
import { SignInButtonCustom } from '@/components/ui/sign-in-button';
import { SignUpButtonCustom } from '@/components/ui/sign-up-button';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset
} from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Atoma',
  description:
    'This is a preview of using reasoning models with Next.js and the AI SDK.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <Sidebar>
                <SidebarHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Atoma</h2>
                    <SidebarHeaderTrigger />
                  </div>
                </SidebarHeader>
                <SidebarContent>
                  {/* Sidebar content can be added here later */}
                </SidebarContent>
              </Sidebar>
              
              <SidebarInset>
                <div className="fixed right-0 left-0 w-full top-0 bg-white dark:bg-zinc-950">
                  <div className="flex justify-between items-center p-4">
                    <div className="flex flex-row items-center gap-2 shrink-0 ">
                      <span className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2 home-links">
                        <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-4">
                          <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2">
                            <LeftHeaderControls />
                          </div>
                        </div>
                      </span>
                    </div>
                    <HeaderControls />
                  </div>
                </div>
                <Toaster position="top-center" />
                <div className="pt-16 pb-4">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
