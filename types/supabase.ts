export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      snippets: {
        Row: {
          id: string
          title: string
          language: string
          prompt: string
          code: string
          created_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          language: string
          prompt: string
          code: string
          created_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          language?: string
          prompt?: string
          code?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
          auth_provider: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          auth_provider?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          auth_provider?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
