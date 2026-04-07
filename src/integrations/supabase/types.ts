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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_views: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          channel_id: string | null
          channel_url: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          label: string
          reward: number
          reward_type: string
        }
        Insert: {
          channel_id?: string | null
          channel_url: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label: string
          reward?: number
          reward_type?: string
        }
        Update: {
          channel_id?: string | null
          channel_url?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          label?: string
          reward?: number
          reward_type?: string
        }
        Relationships: []
      }
      daily_bonus: {
        Row: {
          day: number
          last_claimed: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          day?: number
          last_claimed?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: number
          last_claimed?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_bonus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_referral_tasks: {
        Row: {
          created_at: string
          date: string
          id: string
          reward_claimed: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reward_claimed?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reward_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_referral_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_history: {
        Row: {
          created_at: string
          id: string
          rank: number
          referral_count: number
          reward_coins: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank: number
          referral_count: number
          reward_coins: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number
          referral_count?: number
          reward_coins?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_given: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_given?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_given?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          raw_update: Json
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          raw_update: Json
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          raw_update?: Json
          text?: string | null
          update_id?: number
        }
        Relationships: []
      }
      user_skins: {
        Row: {
          id: string
          purchased_at: string
          skin_name: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          skin_name: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          skin_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          coins: number
          created_at: string
          current_skin: string
          first_name: string | null
          id: string
          lives: number
          photo_url: string | null
          referral_code: string
          referrals: number
          stars: number
          telegram_id: number
          updated_at: string
          username: string | null
        }
        Insert: {
          coins?: number
          created_at?: string
          current_skin?: string
          first_name?: string | null
          id?: string
          lives?: number
          photo_url?: string | null
          referral_code: string
          referrals?: number
          stars?: number
          telegram_id: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          coins?: number
          created_at?: string
          current_skin?: string
          first_name?: string | null
          id?: string
          lives?: number
          photo_url?: string | null
          referral_code?: string
          referrals?: number
          stars?: number
          telegram_id?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      wheel_participants: {
        Row: {
          created_at: string
          id: string
          round_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_participants_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "wheel_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wheel_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_rounds: {
        Row: {
          created_at: string
          id: string
          participant_count: number
          reward_stars: number
          round_time: string
          status: string
          winner_id: string | null
          winner_photo_url: string | null
          winner_username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          participant_count?: number
          reward_stars?: number
          round_time: string
          status?: string
          winner_id?: string | null
          winner_photo_url?: string | null
          winner_username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          participant_count?: number
          reward_stars?: number
          round_time?: string
          status?: string
          winner_id?: string | null
          winner_photo_url?: string | null
          winner_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wheel_rounds_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wheel_ticket_progress: {
        Row: {
          ads_watched: number
          created_at: string
          id: string
          round_id: string
          tickets_earned: number
          user_id: string
        }
        Insert: {
          ads_watched?: number
          created_at?: string
          id?: string
          round_id: string
          tickets_earned?: number
          user_id: string
        }
        Update: {
          ads_watched?: number
          created_at?: string
          id?: string
          round_id?: string
          tickets_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wheel_ticket_progress_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "wheel_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wheel_ticket_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_requests: {
        Row: {
          amount: number
          card_number: string
          card_type: string
          created_at: string
          id: string
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_number: string
          card_type: string
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_number?: string
          card_type?: string
          created_at?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdraw_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
