import { NextResponse } from 'next/server';
import { initRedisServer } from '@/lib/redis-server-init';

// Initialize Redis on application startup
let initializationPromise: Promise<boolean> | null = null;

/**
 * This route initializes Redis when the application starts
 * It's designed to be called during application bootstrap
 */
export async function GET() {
  try {
    // Use singleton pattern to prevent multiple initializations
    if (!initializationPromise) {
      console.log('Starting Redis initialization process...');
      initializationPromise = initRedisServer();
    }
    
    // Wait for initialization to complete
    const success = await initializationPromise;
    
    if (success) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Redis initialized successfully' 
      });
    } else {
      return NextResponse.json(
        { 
          status: 'warning', 
          message: 'Redis initialization failed, application will function with limited features' 
        },
        { status: 200 } // Still return 200 to prevent crashing the app
      );
    }
  } catch (error) {
    console.error('Error during Redis initialization:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Error during Redis initialization' 
      }, 
      { status: 500 }
    );
  }
}
