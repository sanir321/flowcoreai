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
      appointments: {
        Row: {
          contact_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          deleted_at: string | null
          end_at: string
          google_event_id: string | null
          id: string
          notes: string | null
          service: string | null
          session_id: string | null
          start_at: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          deleted_at?: string | null
          end_at: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          service?: string | null
          session_id?: string | null
          start_at: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          deleted_at?: string | null
          end_at?: string
          google_event_id?: string | null
          id?: string
          notes?: string | null
          service?: string | null
          session_id?: string | null
          start_at?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_transactions: {
        Row: {
          amount_credits: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          workspace_id: string
        }
        Insert: {
          amount_credits: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          workspace_id: string
        }
        Update: {
          amount_credits?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          channel: string
          conversation_count: number
          created_at: string
          deleted_at: string | null
          email: string | null
          first_contact: string
          id: string
          last_active: string | null
          merged_into: string | null
          name: string | null
          notes: string | null
          phone: string | null
          session_token: string | null
          tags: string[]
          updated_at: string
          whatsapp_jid: string | null
          workspace_id: string
        }
        Insert: {
          channel?: string
          conversation_count?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_contact?: string
          id?: string
          last_active?: string | null
          merged_into?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          session_token?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_jid?: string | null
          workspace_id: string
        }
        Update: {
          channel?: string
          conversation_count?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_contact?: string
          id?: string
          last_active?: string | null
          merged_into?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          session_token?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_jid?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          active_agent: string | null
          agent_type: string | null
          channel: string
          contact_id: string | null
          created_at: string
          customer_jid: string | null
          customer_name: string | null
          failed_attempts: number
          handoff_at: string | null
          handoff_reason: string | null
          id: string
          is_test: boolean
          last_customer_message_at: string | null
          last_intent: string | null
          last_message_at: string | null
          last_message_preview: string | null
          message_count: number
          metadata: Json
          pending_confirmation: Json | null
          status: string
          typing_status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active_agent?: string | null
          agent_type?: string | null
          channel: string
          contact_id?: string | null
          created_at?: string
          customer_jid?: string | null
          customer_name?: string | null
          failed_attempts?: number
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          is_test?: boolean
          last_customer_message_at?: string | null
          last_intent?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number
          metadata?: Json
          pending_confirmation?: Json | null
          status?: string
          typing_status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active_agent?: string | null
          agent_type?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string
          customer_jid?: string | null
          customer_name?: string | null
          failed_attempts?: number
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          is_test?: boolean
          last_customer_message_at?: string | null
          last_intent?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number
          metadata?: Json
          pending_confirmation?: Json | null
          status?: string
          typing_status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_logs: {
        Row: {
          conversation_snapshot: Json
          created_at: string
          id: string
          notes: string | null
          notification_sent: boolean
          resolved_at: string | null
          resolved_by: string | null
          session_id: string
          status: string
          trigger_message: string | null
          trigger_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conversation_snapshot: Json
          created_at?: string
          id?: string
          notes?: string | null
          notification_sent?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          session_id: string
          status?: string
          trigger_message?: string | null
          trigger_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conversation_snapshot?: Json
          created_at?: string
          id?: string
          notes?: string | null
          notification_sent?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string
          status?: string
          trigger_message?: string | null
          trigger_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          google_email: string | null
          refresh_token: string
          scopes: string[]
          sheet_id: string | null
          sheet_range: string
          token_expiry: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          google_email?: string | null
          refresh_token: string
          scopes: string[]
          sheet_id?: string | null
          sheet_range?: string
          token_expiry: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          google_email?: string | null
          refresh_token?: string
          scopes?: string[]
          sheet_id?: string | null
          sheet_range?: string
          token_expiry?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      gowa_sessions: {
        Row: {
          created_at: string
          display_name: string | null
          error_message: string | null
          gowa_session_id: string
          id: string
          last_seen_at: string | null
          phone_jid: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          gowa_session_id: string
          id?: string
          last_seen_at?: string | null
          phone_jid?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          error_message?: string | null
          gowa_session_id?: string
          id?: string
          last_seen_at?: string | null
          phone_jid?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gowa_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          source_id: string
          started_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          source_id: string
          started_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          source_id?: string
          started_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          deleted_at: string | null
          embedding: string | null
          id: string
          metadata: Json
          source_id: string
          token_count: number | null
          workspace_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id: string
          token_count?: number | null
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          source_id?: string
          token_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "kb_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_sources: {
        Row: {
          agent_id: string | null
          chunk_count: number
          created_at: string
          deleted_at: string | null
          error_message: string | null
          id: string
          label: string
          source_type: string
          status: string
          storage_path: string | null
          updated_at: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          chunk_count?: number
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          label: string
          source_type: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          url?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          chunk_count?: number
          created_at?: string
          deleted_at?: string | null
          error_message?: string | null
          id?: string
          label?: string
          source_type?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "workspace_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_type: string | null
          content: string
          created_at: string
          direction: string
          gowa_message_id: string | null
          id: string
          is_test: boolean
          metadata: Json
          role: string
          session_id: string
          workspace_id: string
        }
        Insert: {
          agent_type?: string | null
          content: string
          created_at?: string
          direction: string
          gowa_message_id?: string | null
          id?: string
          is_test?: boolean
          metadata?: Json
          role: string
          session_id: string
          workspace_id: string
        }
        Update: {
          agent_type?: string | null
          content?: string
          created_at?: string
          direction?: string
          gowa_message_id?: string | null
          id?: string
          is_test?: boolean
          metadata?: Json
          role?: string
          session_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          ip: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
        }
        Relationships: []
      }
      widget_config: {
        Row: {
          accent_color: string
          allowed_domains: string[] | null
          avatar_url: string | null
          greeting: string
          theme: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accent_color?: string
          allowed_domains?: string[] | null
          avatar_url?: string | null
          greeting?: string
          theme?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accent_color?: string
          allowed_domains?: string[] | null
          avatar_url?: string | null
          greeting?: string
          theme?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_agents: {
        Row: {
          agent_type: string
          config: Json
          created_at: string
          id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_type: string
          config?: Json
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_type?: string
          config?: Json
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_notifications: {
        Row: {
          email_on_booking: boolean
          email_on_escalation: boolean
          email_on_lead: boolean
          notification_mode: string
          updated_at: string
          whatsapp_alert_number: string | null
          workspace_id: string
        }
        Insert: {
          email_on_booking?: boolean
          email_on_escalation?: boolean
          email_on_lead?: boolean
          notification_mode?: string
          updated_at?: string
          whatsapp_alert_number?: string | null
          workspace_id: string
        }
        Update: {
          email_on_booking?: boolean
          email_on_escalation?: boolean
          email_on_lead?: boolean
          notification_mode?: string
          updated_at?: string
          whatsapp_alert_number?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          business_type: string | null
          created_at: string
          credits_balance: number
          deleted_at: string | null
          description: string | null
          employee_count: string | null
          id: string
          is_ai_enabled: boolean
          logo_url: string | null
          name: string
          owner_id: string
          owner_personal_phone: string | null
          plan: string
          plan_type: string

          status: string
          timezone: string
          updated_at: string
          website_url: string | null
          welcome_template: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          credits_balance?: number
          deleted_at?: string | null
          description?: string | null
          employee_count?: string | null
          id?: string
          is_ai_enabled?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          owner_personal_phone?: string | null
          plan?: string
          plan_type?: string

          status?: string
          timezone?: string
          updated_at?: string
          website_url?: string | null
          welcome_template?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          credits_balance?: number
          deleted_at?: string | null
          description?: string | null
          employee_count?: string | null
          id?: string
          is_ai_enabled?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          owner_personal_phone?: string | null
          plan?: string
          plan_type?: string

          status?: string
          timezone?: string
          updated_at?: string
          website_url?: string | null
          welcome_template?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_kb_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          p_workspace_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
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
