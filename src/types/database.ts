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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      goal: {
        Row: {
          created_at: string
          end_at: string
          text: string
          uuid: string
        }
        Insert: {
          created_at?: string
          end_at?: string
          text?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          text?: string
          uuid?: string
        }
        Relationships: []
      }
      goal_steps: {
        Row: {
          goal_uuid: string
          id: number
          step_uuid: string
        }
        Insert: {
          goal_uuid?: string
          id?: number
          step_uuid?: string
        }
        Update: {
          goal_uuid?: string
          id?: number
          step_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_steps_goal_uuid_fkey"
            columns: ["goal_uuid"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "goal_steps_step_uuid_fkey"
            columns: ["step_uuid"]
            isOneToOne: false
            referencedRelation: "step"
            referencedColumns: ["uuid"]
          },
        ]
      }
      insight: {
        Row: {
          created_at: string
          effort_level: number
          progress: number
          stress_level: number
          summary: string
          uuid: string
        }
        Insert: {
          created_at?: string
          effort_level?: number
          progress?: number
          stress_level?: number
          summary?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          effort_level?: number
          progress?: number
          stress_level?: number
          summary?: string
          uuid?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string
          first_name: string | null
          last_name: string | null
          subscription_status: string | null
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          subscription_status?: string | null
          updated_at?: string
          uuid: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          subscription_status?: string | null
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      session: {
        Row: {
          created_at: string
          goal_uuid: string
          insight_uuid: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          goal_uuid?: string
          insight_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          goal_uuid?: string
          insight_uuid?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_goal_uuid_fkey"
            columns: ["goal_uuid"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "session_insight_uuid_fkey"
            columns: ["insight_uuid"]
            isOneToOne: false
            referencedRelation: "insight"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "session_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
      step: {
        Row: {
          created_at: string
          end_at: string
          isCompleted: boolean
          next_step: string | null
          text: string
          uuid: string
        }
        Insert: {
          created_at?: string
          end_at?: string
          isCompleted?: boolean
          next_step?: string | null
          text?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          isCompleted?: boolean
          next_step?: string | null
          text?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_next_step_fkey"
            columns: ["next_step"]
            isOneToOne: false
            referencedRelation: "step"
            referencedColumns: ["uuid"]
          },
        ]
      }
      user_goal: {
        Row: {
          created_at: string
          goal_uuid: string
          id: number
          user_uuid: string
        }
        Insert: {
          created_at?: string
          goal_uuid?: string
          id?: number
          user_uuid?: string
        }
        Update: {
          created_at?: string
          goal_uuid?: string
          id?: number
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goal_goal_uuid_fkey"
            columns: ["goal_uuid"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "user_goal_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profile: {
        Args: { p_user_uuid: string }
        Returns: {
          created_at: string
          first_name: string
          last_name: string
          updated_at: string
          user_uuid: string
        }[]
      }
      get_profile: {
        Args: { p_user_uuid: string }
        Returns: {
          created_at: string
          first_name: string | null
          last_name: string | null
          subscription_status: string | null
          updated_at: string
          uuid: string
        }
      }
      update_profile: {
        Args: {
          p_first_name?: string
          p_last_name?: string
          p_user_uuid: string
        }
        Returns: {
          created_at: string
          first_name: string
          last_name: string
          updated_at: string
          user_uuid: string
        }[]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
