"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ApplicationInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/init');
        const data = await response.json();
        
        if (data.status === 'success' || data.status === 'warning') {
          setInitialized(true);
          console.log('Application initialized:', data.message);
          
          if (data.status === 'warning') {
            toast.warning('Application initialized with warnings. Some features may be limited.');
          }
        } else {
          setError(data.message || 'Unknown initialization error');
          toast.error('Failed to initialize application services');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : String(err));
        toast.error('Failed to connect to application services');
      }
    };
    
    initializeApp();
  }, []);
  
  // This component doesn't render anything visible
  return null;
}
