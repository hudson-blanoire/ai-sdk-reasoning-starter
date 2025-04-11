# Migration from Redis to Supabase and ChromaDB

## Overview

This document outlines the migration process from Redis to:
- **Supabase**: For chat history management (sessions and messages)
- **ChromaDB**: For vector search and document management

## Prerequisites

1. Supabase Project
   - Create a project at https://supabase.com
   - Initialize database schema using `scripts/supabase-init.sql`
   - Obtain API keys (anon key and service role key)

2. ChromaDB
   - Option A: Use local instance
     ```bash
     docker run -p 8000:8000 chromadb/chroma
     ```
   - Option B: Use managed service

3. Environment Variables
   - Copy `.env.local.template` to `.env.local`
   - Fill in all required variables

## Migration Steps

### 1. Install Dependencies

```bash
pnpm add @supabase/supabase-js chromadb @langchain/chroma langchain dotenv
```

### 2. Initialize Supabase Schema

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/supabase-init.sql`
4. Execute the script to create tables and security policies

### 3. Run Migration Script

```bash
# Ensure Redis is running and accessible
npx tsx scripts/migrate-redis-to-supabase-chroma.ts
```

### 4. Verify Migration

1. Check Supabase for migrated sessions and messages
2. Test ChromaDB document search functionality

### 5. Update Application Code

The following components have been updated to use the new infrastructure:

- `/lib/supabase/*`: Supabase client and data access utilities
- `/lib/chroma/*`: ChromaDB client and document management utilities
- `/app/api/*`: API routes for interacting with Supabase and ChromaDB

### 6. Testing

After migration, test the following functionality:

1. **User Authentication**
   - Log in with Clerk
   - Verify user session persistence

2. **Chat History**
   - Load existing conversations
   - Create new chat sessions
   - Add messages to chat sessions

3. **Document Management**
   - Upload documents
   - Search documents using vector similarity
   - Verify document retrieval accuracy

## Rollback Plan

If issues arise during migration:

1. Keep Redis infrastructure in place during testing
2. Implement feature flags to toggle between Redis and new infrastructure
3. If necessary, revert code changes and continue using Redis

## Monitoring and Maintenance

1. **Supabase**
   - Monitor database size and query performance
   - Set up backup schedules
   - Consider adding database functions for complex operations

2. **ChromaDB**
   - Monitor collection sizes
   - Implement regular reindexing for optimal performance
   - Consider sharding strategies for large document collections

## Future Improvements

1. **Supabase Edge Functions**
   - Move complex business logic to Supabase Edge Functions

2. **Hybrid Search with ChromaDB**
   - Implement hybrid search (semantic + keyword)
   - Fine-tune embedding models for domain-specific use cases

3. **Realtime Updates**
   - Leverage Supabase realtime subscriptions for chat updates
