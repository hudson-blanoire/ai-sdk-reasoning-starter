/**
 * Application Initialization Module
 * 
 * This module handles the initialization of all database connections
 * and services required by the application.
 */

import { initializeChromaDB } from './chroma/init';

let isInitialized = false;

/**
 * Initialize all required services for the application
 * This should be called during application startup
 */
export async function initializeServices(): Promise<boolean> {
  if (isInitialized) {
    console.log('Services already initialized');
    return true;
  }
  
  console.log('Starting application initialization process...');
  
  try {
    // Initialize ChromaDB for vector search
    const chromaInitialized = await initializeChromaDB();
    if (!chromaInitialized) {
      console.warn('ChromaDB initialization failed or incomplete');
    }
    
    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.warn('Supabase configuration incomplete. Please check environment variables.');
    } else {
      console.log('Supabase configuration validated');
    }
    
    // Validate Clerk environment variables
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkPublishableKey || !clerkSecretKey) {
      console.warn('Clerk configuration incomplete. Please check environment variables.');
    } else {
      console.log('Clerk configuration validated');
    }
    
    isInitialized = true;
    console.log('Application initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Application initialization failed:', error);
    return false;
  }
}
