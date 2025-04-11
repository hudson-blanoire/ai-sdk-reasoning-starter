export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          created_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_clerk_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
