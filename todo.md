# IntelIP Atoma Development TODO List

This document tracks all tasks that need to be completed for the IntelIP Atoma Agentic Web App development.

## Phase 1: Foundation & UI Cleanup

- [ ] **UI Cleanup**
  - [ ] Remove all Vercel branding
  - [ ] Update page titles to Atoma using the Current Title Font

- [ ] **Model Infrastructure**
  - [ ] Set up environment variables for OPENAI & GROQ

## Phase 2: Model Integration

- [ ] **Llama 3.3 70B via Groq**
  - [ ] Install Groq package via the Vercel AI SDK
  - [ ] Set up Groq API integration
  - [ ] Configure model parameters (temp: 0.1, max tokens: 8192)
  - [ ] Test streaming capabilities

- [ ] **OpenAI Models**
  - [ ] Install OpenAI package via the Vercel AI SDK
  - [ ] Implement OpenAI provider
  - [ ] Configure GPT-4o model
  - [ ] Configure o3-mini model
  - [ ] Test performance

- [ ] **Model Switching UI**
  - [ ] Implement localStorage persistence

## Phase 3: Agentic Mode

- [ ] **Agentic Toggle**
  - [ ] Create toggle button next to Reasoning checkbox designed just like the Reasoning Checkboc
  - [ ] Implement mutual exclusivity logic
  - [ ] Add transition animations
  - [ ] Create visual indicators for active state

- [ ] **Exa.AI Search**
  - [ ] Add Exa.AI Search to tools within all the LLMs. Utilize Vercel AI SDK tool calling for this.
  - [ ] Implement search middleware
  - [ ] Add citation generation
  - [ ] Configure search parameters
  - [ ] Build test suite for search integration

## Phase 4: Authentication & Data Persistence

- [ ] **Authentication with Clerk**
  - [ ] Install Clerk package (`pnpm add @clerk/nextjs`)
  - [ ] Set up Clerk API keys in environment variables
  - [ ] Create middleware.ts file for route protection
  - [ ] Add ClerkProvider to layout.tsx
  - [ ] Customize sign-in and sign-up UI
  - [ ] Implement social authentication (Google)
  - [ ] Set up user profile management

- [ ] **Database Setup**
  - [ ] Create Supabase project
  - [ ] Configure security policies
  - [ ] Create database schema:
    - [ ] Users table
    - [ ] Chat sessions table
    - [ ] Messages table
  - [ ] Implement data access layer
  - [ ] Set up database migrations

- [ ] **Chat History**
  - [ ] Implement message persistence
  - [ ] Add automatic session creation
  - [ ] Create session management UI
  - [ ] Set up real-time synchronization

## Phase 5: UI Enhancements

- [ ] **Custom Sidebar**
  - [ ] Integrate Aceternity sidebar component
  - [ ] Implement responsive behavior
  - [ ] Populate with chat history
  - [ ] Add session management capabilities

- [ ] **User Profile**
  - [ ] Integrate Clerk user profile components
  - [ ] Customize profile settings interface
  - [ ] Link profile data with chat history

- [ ] **Chat Experience**
  - [ ] Integrate React Markdown
  - [ ] Add syntax highlighting
  - [ ] Implement LaTeX rendering
  - [ ] Add typing indicators
  - [ ] Create message actions

## Phase 6: Monetization

- [ ] **Polar.sh Integration**
  - [ ] Create Polar.sh account
  - [ ] Configure webhooks
  - [ ] Implement verification API
  - [ ] Set up subscription tiers
  - [ ] Create subscription page
  - [ ] Design upgrade prompts

- [ ] **Premium Features**
  - [ ] Build feature flag system
  - [ ] Implement usage limits for free tier
  - [ ] Add model access restrictions
  - [ ] Set up analytics and conversion tracking

## Phase 7: Integration & Optimization

- [ ] **Performance**
  - [ ] Add SWR for data fetching
  - [ ] Implement response caching
  - [ ] Add lazy loading for chat history
  - [ ] Optimize database queries

- [ ] **Testing & Deployment**
  - [ ] Create test suite
  - [ ] Run cross-browser tests
  - [ ] Perform security testing
  - [ ] Configure production environment
  - [ ] Set up monitoring tools 