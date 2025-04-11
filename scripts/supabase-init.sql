-- Supabase SQL initialization script for Atoma application
-- Run this script in the Supabase SQL Editor to set up required tables and policies

-- Create a function to get the Clerk user ID from request headers
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(current_setting('request.headers.x-clerk-user-id', true), NULL);
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (user_id = get_clerk_user_id());
  
CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = get_clerk_user_id());
  
CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (user_id = get_clerk_user_id());
  
CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  USING (user_id = get_clerk_user_id());

-- Create policies for messages
CREATE POLICY "Users can view messages in their sessions"
  ON messages FOR SELECT
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = get_clerk_user_id()
  ));
  
CREATE POLICY "Users can insert messages in their sessions"
  ON messages FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE user_id = get_clerk_user_id()
  ));
  
CREATE POLICY "Users can update messages in their sessions"
  ON messages FOR UPDATE
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = get_clerk_user_id()
  ));
  
CREATE POLICY "Users can delete messages in their sessions"
  ON messages FOR DELETE
  USING (session_id IN (
    SELECT id FROM sessions WHERE user_id = get_clerk_user_id()
  ));
