import { Toaster } from 'sonner';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Link from 'next/link';
import type { Metadata } from 'next';

import './globals.css';
import { DeployButton } from '@/components/deploy-button';
import { StarButton } from '@/components/star-button';

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
                <Link
                  className="text-zinc-800 dark:text-zinc-100 -translate-y-[.5px]"
                  rel="noopener"
                  href="/"
                >
                  <div className="jsx-e3e12cc6f9ad5a71 text-zinc-800 dark:text-zinc-100">
                    <svg
                      data-testid="geist-icon"
                      height={16}
                      strokeLinejoin="round"
                      viewBox="0 0 16 16"
                      width={16}
                      style={{ color: 'currentcolor' }}
                    >
                      <path
                        d="M8.40706 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </Link>
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
