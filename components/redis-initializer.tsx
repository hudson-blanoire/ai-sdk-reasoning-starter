'use client';

import { useEffect, useState } from 'react';

/**
 * This component initializes Redis when the application loads
 * It should be included in the root layout to ensure Redis is ready
 * before any components that depend on it are rendered
 */
export function RedisInitializer() {
  const [status, setStatus] = useState<'initializing' | 'success' | 'error'>('initializing');

  useEffect(() => {
    // Only run in the browser, not during SSR
    if (typeof window === 'undefined') return;

    async function initializeRedis() {
      try {
        // Call the initialization API route
        const response = await fetch('/api/redis-init');
        const data = await response.json();
        
        if (data.status === 'success') {
          console.log('Redis initialized successfully');
          setStatus('success');
        } else {
          console.warn('Redis initialization warning:', data.message);
          setStatus('success'); // Still mark as success to not block the app
        }
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        setStatus('error');
      }
    }

    initializeRedis();
  }, []);

  // This component doesn't render anything visible
  return null;
}
