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
      agent_traces: {
        Row: {
          circuit_breaker_open: boolean | null
          created_at: string | null
          deleted_at: string | null
          escalation_triggered: boolean | null
          extraction_confidence: number | null
          fallback_used: boolean | null
          fsm_state: string | null
          grounding_score: number | null
          guardrail_blocked: boolean | null
          id: string
          intent_detected: string | null
          latency_ms: number | null
          message_length: number | null
          model_used: string | null
          response_length: number | null
          session_id: string
          tokens_used: number | null
          trace_id: string
          validation_errors: Json | null
          workspace_id: string
        }
        Insert: {
          circuit_breaker_open?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          escalation_triggered?: boolean | null
          extraction_confidence?: number | null
          fallback_used?: boolean | null
          fsm_state?: string | null
          grounding_score?: number | null
          guardrail_blocked?: boolean | null
          id?: string
          intent_detected?: string | null
          latency_ms?: number | null
          message_length?: number | null
          model_used?: string | null
          response_length?: number | null
          session_id: string
          tokens_used?: number | null
          trace_id: string
          validation_errors?: Json | null
          workspace_id: string
        }
        Update: {
          circuit_breaker_open?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          escalation_triggered?: boolean | null
          extraction_confidence?: number | null
          fallback_used?: boolean | null
          fsm_state?: string | null
          grounding_score?: number | null
          guardrail_blocked?: boolean | null
          id?: string
          intent_detected?: string | null
          latency_ms?: number | null
          message_length?: number | null
          model_used?: string | null
          response_length?: number | null
          session_id?: string
          tokens_used?: number | null
          trace_id?: string
          validation_errors?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_traces_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_traces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          contact_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          deleted_at: string | null
          end_at: string
          google_event_id: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          service: string | null
          session_id: string | null
          start_at: string
          status: string
          sync_status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          deleted_at?: string | null
          end_at: string
          google_event_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          service?: string | null
          session_id?: string | null
          start_at: string
          status?: string
          sync_status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          deleted_at?: string | null
          end_at?: string
          google_event_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          service?: string | null
          session_id?: string | null
          start_at?: string
          status?: string
          sync_status?: string | null
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          payload: Json | null
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          payload?: Json | null
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
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
          amount_paid: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          transaction_type: string
          workspace_id: string
        }
        Insert: {
          amount_credits: number
          amount_paid?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          transaction_type: string
          workspace_id: string
        }
        Update: {
          amount_credits?: number
          amount_paid?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
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
      booking_sessions: {
        Row: {
          appointment_id: string | null
          attempts: Json
          collected: Json
          created_at: string
          deleted_at: string | null
          id: string
          session_id: string
          state: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          appointment_id?: string | null
          attempts?: Json
          collected?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id: string
          state?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          appointment_id?: string | null
          attempts?: Json
          collected?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id?: string
          state?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          template_key: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          template_key: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          template_key?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      callback_queue: {
        Row: {
          created_at: string | null
          id: string
          payload: Json
          processed_at: string | null
          scheduled_for: string | null
          status: string
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string | null
          status?: string
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string | null
          status?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "callback_queue_workspace_id_fkey"
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
          last_followed_up_at: string | null
          lead_score: number | null
          lead_source: string | null
          merged_into: string | null
          name: string | null
          notes: string | null
          phone: string | null
          pipeline_stage: string | null
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
          last_followed_up_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          merged_into?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
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
          last_followed_up_at?: string | null
          lead_score?: number | null
          lead_source?: string | null
          merged_into?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
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
          deleted_at: string | null
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
          resolved_by: string | null
          status: string
          total_tokens_used: number
          typing_status: string | null
          updated_at: string
          working_context: Json | null
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
          deleted_at?: string | null
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
          resolved_by?: string | null
          status?: string
          total_tokens_used?: number
          typing_status?: string | null
          updated_at?: string
          working_context?: Json | null
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
          deleted_at?: string | null
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
          resolved_by?: string | null
          status?: string
          total_tokens_used?: number
          typing_status?: string | null
          updated_at?: string
          working_context?: Json | null
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
      cron_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          message: string | null
          metadata: Json | null
          scope: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          scope?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string | null
          metadata?: Json | null
          scope?: string | null
        }
        Relationships: []
      }
      escalation_logs: {
        Row: {
          conversation_snapshot: Json
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
        ]
      }
      failed_messages: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          failure_reason: string | null
          id: string
          last_retried_at: string | null
          raw_message: Json
          resolved: boolean | null
          retry_count: number | null
          session_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          last_retried_at?: string | null
          raw_message: Json
          resolved?: boolean | null
          retry_count?: number | null
          session_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          last_retried_at?: string | null
          raw_message?: Json
          resolved?: boolean | null
          retry_count?: number | null
          session_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failed_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          contact_id: string | null
          created_at: string | null
          deleted_at: string | null
          failure_reason: string | null
          id: string
          message_template: string
          scheduled_at: string
          sent_at: string | null
          session_id: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          message_template: string
          scheduled_at: string
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          failure_reason?: string | null
          id?: string
          message_template?: string
          scheduled_at?: string
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      kb_response_cache: {
        Row: {
          access_count: number
          accessed_at: string
          agent_hash: string | null
          cache_key: string
          created_at: string
          deleted_at: string | null
          id: string
          model: string | null
          query_text: string
          response_text: string
          workspace_id: string
        }
        Insert: {
          access_count?: number
          accessed_at?: string
          agent_hash?: string | null
          cache_key: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          model?: string | null
          query_text: string
          response_text: string
          workspace_id: string
        }
        Update: {
          access_count?: number
          accessed_at?: string
          agent_hash?: string | null
          cache_key?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          model?: string | null
          query_text?: string
          response_text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_response_cache_workspace_id_fkey"
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
          bp_extracted_fields: Json
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
          bp_extracted_fields?: Json
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
          bp_extracted_fields?: Json
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
      login_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string | null
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_media: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_media_workspace_id_fkey"
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
          deleted_at: string | null
          direction: string
          gowa_message_id: string | null
          id: string
          is_test: boolean
          metadata: Json
          role: string
          session_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          agent_type?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          direction: string
          gowa_message_id?: string | null
          id?: string
          is_test?: boolean
          metadata?: Json
          role: string
          session_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          agent_type?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          direction?: string
          gowa_message_id?: string | null
          id?: string
          is_test?: boolean
          metadata?: Json
          role?: string
          session_id?: string
          status?: string
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
      orders: {
        Row: {
          contact_id: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          items: Json | null
          notes: string | null
          order_number: string | null
          payment_method: string | null
          payment_ref: string | null
          session_id: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          upi_link: string | null
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          upi_link?: string | null
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_ref?: string | null
          session_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          upi_link?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: number
          last_name: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: never
          last_name: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: never
          last_name?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          contact_id: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          items: Json | null
          notes: string | null
          quote_number: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
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
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      required_info_templates: {
        Row: {
          business_type: string
          created_at: string | null
          description: string | null
          field_key: string
          field_type: string
          id: string
          is_required: boolean
          label: string
          priority: number
          section: string
        }
        Insert: {
          business_type: string
          created_at?: string | null
          description?: string | null
          field_key: string
          field_type?: string
          id?: string
          is_required?: boolean
          label: string
          priority?: number
          section: string
        }
        Update: {
          business_type?: string
          created_at?: string | null
          description?: string | null
          field_key?: string
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          priority?: number
          section?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          session_id: string
          status: string
          subject: string | null
          ticket_number: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          session_id: string
          status?: string
          subject?: string | null
          ticket_number: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          session_id?: string
          status?: string
          subject?: string | null
          ticket_number?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_call_logs: {
        Row: {
          args: Json
          created_at: string
          duration_ms: number
          error: string | null
          id: string
          result: Json | null
          session_id: string
          success: boolean
          tool_name: string
          workspace_id: string
        }
        Insert: {
          args?: Json
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          result?: Json | null
          session_id: string
          success?: boolean
          tool_name: string
          workspace_id: string
        }
        Update: {
          args?: Json
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          result?: Json | null
          session_id?: string
          success?: boolean
          tool_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_call_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_call_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          business_type: string | null
          created_at: string | null
          email: string
          id: string
          source: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      widget_config: {
        Row: {
          accent_color: string
          agent_name: string | null
          allow_anonymous: boolean | null
          allowed_domains: string[] | null
          auto_fill_params: boolean | null
          avatar_url: string | null
          default_country: string | null
          deleted_at: string | null
          email_notifications: boolean | null
          enable_whatsapp: boolean | null
          greeting: string
          header_text: string | null
          is_active: boolean | null
          launcher_icon: string | null
          logo_url: string | null
          post_form_message: string | null
          theme: string
          updated_at: string
          whatsapp_number: string | null
          workspace_id: string
        }
        Insert: {
          accent_color?: string
          agent_name?: string | null
          allow_anonymous?: boolean | null
          allowed_domains?: string[] | null
          auto_fill_params?: boolean | null
          avatar_url?: string | null
          default_country?: string | null
          deleted_at?: string | null
          email_notifications?: boolean | null
          enable_whatsapp?: boolean | null
          greeting?: string
          header_text?: string | null
          is_active?: boolean | null
          launcher_icon?: string | null
          logo_url?: string | null
          post_form_message?: string | null
          theme?: string
          updated_at?: string
          whatsapp_number?: string | null
          workspace_id: string
        }
        Update: {
          accent_color?: string
          agent_name?: string | null
          allow_anonymous?: boolean | null
          allowed_domains?: string[] | null
          auto_fill_params?: boolean | null
          avatar_url?: string | null
          default_country?: string | null
          deleted_at?: string | null
          email_notifications?: boolean | null
          enable_whatsapp?: boolean | null
          greeting?: string
          header_text?: string | null
          is_active?: boolean | null
          launcher_icon?: string | null
          logo_url?: string | null
          post_form_message?: string | null
          theme?: string
          updated_at?: string
          whatsapp_number?: string | null
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
          deleted_at: string | null
          id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_type: string
          config?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_type?: string
          config?: Json
          created_at?: string
          deleted_at?: string | null
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
          deleted_at: string | null
          email_on_booking: boolean
          email_on_escalation: boolean
          email_on_lead: boolean
          notification_mode: string
          updated_at: string
          whatsapp_alert_number: string | null
          workspace_id: string
        }
        Insert: {
          deleted_at?: string | null
          email_on_booking?: boolean
          email_on_escalation?: boolean
          email_on_lead?: boolean
          notification_mode?: string
          updated_at?: string
          whatsapp_alert_number?: string | null
          workspace_id: string
        }
        Update: {
          deleted_at?: string | null
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
          business_profile: Json | null
          business_type: string | null
          created_at: string
          credits_balance: number
          deleted_at: string | null
          description: string | null
          employee_count: string | null
          guardrail_config: Json
          id: string
          is_ai_enabled: boolean
          kb_config: Json | null
          logo_url: string | null
          name: string
          owner_id: string
          owner_personal_phone: string | null
          plan: string
          safety_pin_hash: string | null
          service_synonyms: Json | null
          services_offered: string | null
          status: string
          timezone: string
          updated_at: string
          upi_id: string | null
          website_url: string | null
          welcome_template: string | null
        }
        Insert: {
          business_profile?: Json | null
          business_type?: string | null
          created_at?: string
          credits_balance?: number
          deleted_at?: string | null
          description?: string | null
          employee_count?: string | null
          guardrail_config?: Json
          id?: string
          is_ai_enabled?: boolean
          kb_config?: Json | null
          logo_url?: string | null
          name: string
          owner_id: string
          owner_personal_phone?: string | null
          plan?: string
          safety_pin_hash?: string | null
          service_synonyms?: Json | null
          services_offered?: string | null
          status?: string
          timezone?: string
          updated_at?: string
          upi_id?: string | null
          website_url?: string | null
          welcome_template?: string | null
        }
        Update: {
          business_profile?: Json | null
          business_type?: string | null
          created_at?: string
          credits_balance?: number
          deleted_at?: string | null
          description?: string | null
          employee_count?: string | null
          guardrail_config?: Json
          id?: string
          is_ai_enabled?: boolean
          kb_config?: Json | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          owner_personal_phone?: string | null
          plan?: string
          safety_pin_hash?: string | null
          service_synonyms?: Json | null
          services_offered?: string | null
          status?: string
          timezone?: string
          updated_at?: string
          upi_id?: string | null
          website_url?: string | null
          welcome_template?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_performance_report: {
        Row: {
          ai_resolution_rate_pct: number | null
          ai_resolutions: number | null
          avg_latency: number | null
          block_count: number | null
          fallback_count: number | null
          total_traces: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_traces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_role_safe: { Args: never; Returns: string }
      auth_uid_safe: { Args: never; Returns: string }
      check_login_lockout: {
        Args: {
          p_email: string
          p_ip: string
          p_lockout_minutes?: number
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: {
          attempts_remaining: number
          locked: boolean
          lockout_seconds: number
        }[]
      }
      decrement_credits:
        | {
            Args: { p_credits: number; p_workspace_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_credits: number
              p_session_id: string
              p_workspace_id: string
            }
            Returns: undefined
          }
      get_distinct_kb_tags: {
        Args: { p_workspace_id: string }
        Returns: string[]
      }
      get_user_email: { Args: { user_id: string }; Returns: string }
      get_workspace_health: { Args: { p_workspace_id: string }; Returns: Json }
      lock_booking_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      match_kb_chunks: {
        Args: {
          match_count: number
          match_threshold: number
          p_query_text?: string
          p_workspace_id?: string
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          workspace_id: string
        }[]
      }
      process_pending_follow_ups: { Args: never; Returns: undefined }
      process_webhook_message: {
        Args: {
          p_content: string
          p_customer_jid: string
          p_customer_name: string
          p_gowa_message_id?: string
          p_media_caption?: string
          p_media_mime?: string
          p_media_path?: string
          p_media_type?: string
          p_metadata?: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip: string; p_success: boolean }
        Returns: undefined
      }
      sanitize_allowed_domain: { Args: { domain: string }; Returns: string }
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
