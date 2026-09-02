export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      article_recs: {
        Row: {
          category: string
          created_at: string
          id: string
          minutes: number | null
          note: string | null
          source: string | null
          summary: string | null
          title: string
          url: string
          user_id: string
          why: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          summary?: string | null
          title: string
          url: string
          user_id: string
          why?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          minutes?: number | null
          note?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          url?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          audio_path: string | null
          audio_seconds: number | null
          body: string | null
          breathed: boolean
          bullets: string[] | null
          created_at: string
          energy: number
          feelings: string[]
          gratitude: string[] | null
          id: string
          mode: string
          mood: number
          prompt: string | null
          song_id: string | null
          title: string | null
          transcript: string | null
          transcript_status: string
          transcript_summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          audio_seconds?: number | null
          body?: string | null
          breathed?: boolean
          bullets?: string[] | null
          created_at?: string
          energy?: number
          feelings?: string[]
          gratitude?: string[] | null
          id?: string
          mode: string
          mood?: number
          prompt?: string | null
          song_id?: string | null
          title?: string | null
          transcript?: string | null
          transcript_status?: string
          transcript_summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_path?: string | null
          audio_seconds?: number | null
          body?: string | null
          breathed?: boolean
          bullets?: string[] | null
          created_at?: string
          energy?: number
          feelings?: string[]
          gratitude?: string[] | null
          id?: string
          mode?: string
          mood?: number
          prompt?: string | null
          song_id?: string | null
          title?: string | null
          transcript?: string | null
          transcript_status?: string
          transcript_summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_suggestions_enabled: boolean
          body_font: string
          created_at: string
          discreet_notifications: boolean
          display_font: string
          id: string
          insights_enabled: boolean
          last_reminder_sent_at: string | null
          lock_enabled: boolean
          music_artists: string[]
          music_tastes: string[]
          name: string
          passcode: string
          reminder_days: number[]
          reminder_email_enabled: boolean
          reminder_mode: string
          reminder_time: string
          show_mood_in_history: boolean
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          ai_suggestions_enabled?: boolean
          body_font?: string
          created_at?: string
          discreet_notifications?: boolean
          display_font?: string
          id: string
          insights_enabled?: boolean
          last_reminder_sent_at?: string | null
          lock_enabled?: boolean
          music_artists?: string[]
          music_tastes?: string[]
          name?: string
          passcode?: string
          reminder_days?: number[]
          reminder_email_enabled?: boolean
          reminder_mode?: string
          reminder_time?: string
          show_mood_in_history?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          ai_suggestions_enabled?: boolean
          body_font?: string
          created_at?: string
          discreet_notifications?: boolean
          display_font?: string
          id?: string
          insights_enabled?: boolean
          last_reminder_sent_at?: string | null
          lock_enabled?: boolean
          music_artists?: string[]
          music_tastes?: string[]
          name?: string
          passcode?: string
          reminder_days?: number[]
          reminder_email_enabled?: boolean
          reminder_mode?: string
          reminder_time?: string
          show_mood_in_history?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_locks: {
        Row: {
          leased_until: string
          name: string
          paused_reason: string | null
          updated_at: string
        }
        Insert: {
          leased_until: string
          name: string
          paused_reason?: string | null
          updated_at?: string
        }
        Update: {
          leased_until?: string
          name?: string
          paused_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      wellness_metrics_overview: {
        Args: never
        Returns: {
          avg_energy: number
          avg_mood: number
          breathed_entries: number
          total_entries: number
          total_people: number
        }[]
      }
      wellness_metrics_trajectory: {
        Args: never
        Returns: {
          early_avg_energy: number
          early_avg_mood: number
          entries: number
          first_entry_at: string
          last_entry_at: string
          person_code: string
          recent_avg_energy: number
          recent_avg_mood: number
        }[]
      }
      wellness_metrics_weekly: {
        Args: never
        Returns: {
          avg_energy: number
          avg_mood: number
          entries: number
          people: number
          week: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
