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
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: number
          message_id: string | null
          status: number | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: number
          message_id?: string | null
          status?: number | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: number
          message_id?: string | null
          status?: number | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
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
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_intent_id: string
          subscription_id: string | null
          updated_at: string | null
          user_uuid: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_payment_intent_id: string
          subscription_id?: string | null
          updated_at?: string | null
          user_uuid: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["uuid"]
          },
        ]
      }
      profile: {
        Row: {
          coach_link: string
          created_at: string
          daily_streak: number | null
          first_name: string | null
          last_check_in_date: string | null
          last_name: string | null
          notification_time: string
          subscription_status: string | null
          updated_at: string
          uuid: string
        }
        Insert: {
          coach_link?: string
          created_at?: string
          daily_streak?: number | null
          first_name?: string | null
          last_check_in_date?: string | null
          last_name?: string | null
          notification_time?: string
          subscription_status?: string | null
          updated_at?: string
          uuid: string
        }
        Update: {
          coach_link?: string
          created_at?: string
          daily_streak?: number | null
          first_name?: string | null
          last_check_in_date?: string | null
          last_name?: string | null
          notification_time?: string
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
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          interval_type: string
          is_active: boolean
          name: string
          price_cents: number
          stripe_price_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id: string
          interval_type: string
          is_active?: boolean
          name: string
          price_cents: number
          stripe_price_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval_type?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_uuid: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_uuid: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_uuid_fkey"
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
          uuid: string
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
          coach_link: string
          created_at: string
          daily_streak: number
          first_name: string
          last_check_in_date: string
          last_name: string
          notification_time: string
          subscription_status: string
          updated_at: string
          uuid: string
        }[]
      }
      get_profile_from_email: {
        Args: { p_email: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          uuid: string
        }[]
      }
      get_subscription_plans: {
        Args: Record<PropertyKey, never>
        Returns: {
          currency: string
          description: string
          features: Json
          id: string
          interval_type: string
          name: string
          price_cents: number
          stripe_price_id: string
        }[]
      }
      get_todays_tasks_for_checkin: {
        Args: { p_goal_uuid: string }
        Returns: Json
      }
      get_user_email: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_streak: {
        Args: { p_user_uuid: string }
        Returns: Json
      }
      get_user_subscription_status: {
        Args: { p_user_uuid: string }
        Returns: {
          cancel_at_period_end: boolean
          current_period_end: string
          plan_id: string
          plan_name: string
          status: string
          subscription_status: string
        }[]
      }
      record_payment_transaction: {
        Args: {
          p_amount_cents: number
          p_currency: string
          p_description?: string
          p_metadata?: Json
          p_status: string
          p_stripe_payment_intent_id: string
          p_subscription_id: string
          p_user_uuid: string
        }
        Returns: string
      }
      send_notification_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_http_extension: {
        Args: Record<PropertyKey, never>
        Returns: {
          http_available: boolean
          message: string
        }[]
      }
      update_daily_streak: {
        Args: { p_user_uuid: string }
        Returns: boolean
      }
      update_profile: {
        Args: {
          p_first_name?: string
          p_last_name?: string
          p_notification_time?: string
          p_user_uuid: string
        }
        Returns: {
          created_at: string
          first_name: string
          last_name: string
          updated_at: string
          uuid: string
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
      upsert_subscription: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_canceled_at?: string
          p_current_period_end: string
          p_current_period_start: string
          p_plan_id: string
          p_status: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_trial_end?: string
          p_trial_start?: string
          p_user_uuid: string
        }
        Returns: string
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
