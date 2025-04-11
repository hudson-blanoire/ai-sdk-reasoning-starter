import { NextRequest, NextResponse } from 'next/server';
import { initializeServices } from '@/lib/init';

/**
 * API route to initialize application services
 * This should be called during application startup
 */
export async function GET(req: NextRequest) {
  try {
    console.log('Starting application service initialization...');
    
    const success = await initializeServices();
    
    if (success) {
      return NextResponse.json({
        status: 'success',
        message: 'Application services initialized successfully'
      });
    } else {
      return NextResponse.json({
        status: 'warning',
        message: 'Application services initialized with warnings'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error initializing application services:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to initialize application services',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
