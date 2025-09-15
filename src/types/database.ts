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
          init_end_at: string
          text: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          created_at?: string
          init_end_at?: string
          text?: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          init_end_at?: string
          text?: string
          user_uuid?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
      milestone: {
        Row: {
          end_at: string
          goal_uuid: string
          start_at: string
          text: string
          uuid: string
        }
        Insert: {
          end_at?: string
          goal_uuid?: string
          start_at?: string
          text?: string
          uuid?: string
        }
        Update: {
          end_at?: string
          goal_uuid?: string
          start_at?: string
          text?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_goal_uuid_fkey"
            columns: ["goal_uuid"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["uuid"]
          },
        ]
      }
      profile: {
        Row: {
          created_at: string
          daily_streak: number | null
          first_name: string | null
          last_check_in_date: string | null
          last_name: string | null
          subscription_status: string | null
          updated_at: string
          uuid: string
        }
        Insert: {
          created_at?: string
          daily_streak?: number | null
          first_name?: string | null
          last_check_in_date?: string | null
          last_name?: string | null
          subscription_status?: string | null
          updated_at?: string
          uuid: string
        }
        Update: {
          created_at?: string
          daily_streak?: number | null
          first_name?: string | null
          last_check_in_date?: string | null
          last_name?: string | null
          subscription_status?: string | null
          updated_at?: string
          uuid?: string
        }
        Relationships: []
      }
      session: {
        Row: {
          blocker: string
          completion:
            | Database["public"]["CompositeTypes"]["task_completion"][]
            | null
          created_at: string
          goal_uuid: string
          mood: number
          motivation: number
          summary: string
          user_uuid: string
          uuid: string
        }
        Insert: {
          blocker?: string
          completion?:
            | Database["public"]["CompositeTypes"]["task_completion"][]
            | null
          created_at?: string
          goal_uuid?: string
          mood?: number
          motivation?: number
          summary?: string
          user_uuid?: string
          uuid?: string
        }
        Update: {
          blocker?: string
          completion?:
            | Database["public"]["CompositeTypes"]["task_completion"][]
            | null
          created_at?: string
          goal_uuid?: string
          mood?: number
          motivation?: number
          summary?: string
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
            foreignKeyName: "session_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
      task: {
        Row: {
          created_at: string
          end_at: string
          goal_uuid: string
          isCompleted: boolean
          milestone_uuid: string
          start_at: string
          text: string
          uuid: string
        }
        Insert: {
          created_at?: string
          end_at?: string
          goal_uuid?: string
          isCompleted?: boolean
          milestone_uuid?: string
          start_at?: string
          text?: string
          uuid?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          goal_uuid?: string
          isCompleted?: boolean
          milestone_uuid?: string
          start_at?: string
          text?: string
          uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_goal_uuid_fkey"
            columns: ["goal_uuid"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["uuid"]
          },
          {
            foreignKeyName: "step_milestone_uuid_fkey"
            columns: ["milestone_uuid"]
            isOneToOne: false
            referencedRelation: "milestone"
            referencedColumns: ["uuid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_update_tasks: {
        Args: { p_task_updates: Json }
        Returns: Json
      }
      calculate_daily_progress: {
        Args: { p_date?: string; p_goal_uuid: string }
        Returns: Json
      }
      can_check_in_now: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_check_in_session: {
        Args: {
          p_blocker?: string
          p_goal_uuid: string
          p_mood: number
          p_motivation: number
          p_summary: string
          p_task_completions?: Json
        }
        Returns: Json
      }
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
      create_task: {
        Args: {
          p_end_at: string
          p_goal_uuid: string
          p_is_completed?: boolean
          p_milestone_uuid: string
          p_start_at: string
          p_text: string
        }
        Returns: Json
      }
      delete_task: {
        Args: { p_task_uuid: string }
        Returns: boolean
      }
      get_batch_goal_object: {
        Args: { p_user_uuid: string }
        Returns: Json
      }
      get_batch_milestones: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_batch_sessions: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_batch_tasks: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_goal: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_profile: {
        Args: { p_user_uuid: string }
        Returns: {
          created_at: string
          daily_streak: number | null
          first_name: string | null
          last_check_in_date: string | null
          last_name: string | null
          subscription_status: string | null
          updated_at: string
          uuid: string
        }
      }
      get_todays_tasks_for_checkin: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_user_streak: {
        Args: { p_user_uuid: string }
        Returns: Json
      }
      update_daily_streak: {
        Args: { p_user_uuid: string }
        Returns: boolean
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
      update_task_completion: {
        Args: { p_is_completed: boolean; p_task_uuid: string }
        Returns: boolean
      }
      update_task_details: {
        Args: {
          p_new_end_at?: string
          p_new_start_at?: string
          p_new_text?: string
          p_task_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      task_completion: {
        task_uuid: string | null
        iscompleted: boolean | null
      }
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
