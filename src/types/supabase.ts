export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          fallback_used: boolean | null
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
          workspace_id: string
        }
        Insert: {
          circuit_breaker_open?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          escalation_triggered?: boolean | null
          fallback_used?: boolean | null
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
          workspace_id: string
        }
        Update: {
          circuit_breaker_open?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          escalation_triggered?: boolean | null
          fallback_used?: boolean | null
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: Json
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
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
          deleted_at: string | null
          description: string | null
          id: string
          transaction_type: string
          workspace_id: string
        }
        Insert: {
          amount_credits: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          workspace_id: string
        }
        Update: {
          amount_credits?: number
          created_at?: string
          deleted_at?: string | null
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
      widget_config: {
        Row: {
          accent_color: string
          allowed_domains: string[] | null
          avatar_url: string | null
          deleted_at: string | null
          greeting: string
          theme: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accent_color?: string
          allowed_domains?: string[] | null
          avatar_url?: string | null
          deleted_at?: string | null
          greeting?: string
          theme?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accent_color?: string
          allowed_domains?: string[] | null
          avatar_url?: string | null
          deleted_at?: string | null
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
          business_type: string | null
          created_at: string
          credits_balance: number
          deleted_at: string | null
          description: string | null
          employee_count: string | null
          guardrail_config: Json
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
          upi_id: string | null
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
          guardrail_config?: Json
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
          upi_id?: string | null
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
          guardrail_config?: Json
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
          block_rate: number | null
          fallback_rate: number | null
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
      get_workspace_health: {
        Args: { ws_id: string }
        Returns: {
          avg_latency: number
          block_rate: number
          fallback_rate: number
          total_traces: number
        }[]
      }
      match_kb_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_workspace_id?: string
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
