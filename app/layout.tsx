import { Toaster } from 'sonner';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from 'next/link';
import type { Metadata } from 'next';

import './globals.css';

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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="fixed right-0 left-0 w-full top-0 bg-white dark:bg-zinc-950">
          <div className="flex justify-between items-center p-4">
            <div className="flex flex-row items-center gap-2 shrink-0 ">
              <span className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2 home-links">
                <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-4">
                  <Link className="flex flex-row items-center gap-2" href="/">
                    <div className="jsx-e3e12cc6f9ad5a71 flex flex-row items-center gap-2">
                      <div className="jsx-e3e12cc6f9ad5a71 text-lg font-bold text-zinc-800 dark:text-zinc-100">
                        Atoma
                      </div>
                    </div>
                  </Link>
                </div>
              </span>
            </div>
            <div className="flex flex-row items-center gap-2 shrink-0">
              {/* Removed StarButton and DeployButton */}
            </div>
          </div>
        </div>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
