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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          body: string
          course_id: string
          created_at: string
          id: string
          position: number
          resource_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          course_id: string
          created_at?: string
          id?: string
          position?: number
          resource_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          resource_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          is_active: boolean
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          is_active?: boolean
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          is_active?: boolean
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          destination_url: string | null
          ends_at: string | null
          icon: string
          id: string
          schedule_text: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_url?: string | null
          ends_at?: string | null
          icon?: string
          id?: string
          schedule_text?: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_url?: string | null
          ends_at?: string | null
          icon?: string
          id?: string
          schedule_text?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_images: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_approvals: {
        Row: {
          created_at: string
          id: string
          registration_number: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["member_approval_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_number?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["member_approval_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_number?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["member_approval_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_profiles: {
        Row: {
          age: number | null
          approval_status: Database["public"]["Enums"]["member_approval_state"]
          country: string
          created_at: string
          email: string
          email_verified_at: string | null
          first_name: string
          gender: string
          last_name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          approval_status?: Database["public"]["Enums"]["member_approval_state"]
          country?: string
          created_at?: string
          email?: string
          email_verified_at?: string | null
          first_name?: string
          gender?: string
          last_name?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          approval_status?: Database["public"]["Enums"]["member_approval_state"]
          country?: string
          created_at?: string
          email?: string
          email_verified_at?: string | null
          first_name?: string
          gender?: string
          last_name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          cover_url: string
          created_at: string
          description: string
          destination_url: string
          id: string
          placement: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url: string
          created_at?: string
          description: string
          destination_url: string
          id?: string
          placement?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          description?: string
          destination_url?: string
          id?: string
          placement?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_tickets: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string
          currency: string
          id: string
          item_title: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string
          currency: string
          id?: string
          item_title: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          item_title?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_tickets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          score: number
          submitted_at: string
          total: number
          user_id: string
        }
        Insert: {
          id?: string
          quiz_id: string
          score: number
          submitted_at?: string
          total: number
          user_id: string
        }
        Update: {
          id?: string
          quiz_id?: string
          score?: number
          submitted_at?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choices: Json
          correct_index: number
          created_at: string
          id: string
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          choices: Json
          correct_index: number
          created_at?: string
          id?: string
          position?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          choices?: Json
          correct_index?: number
          created_at?: string
          id?: string
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["support_sender_role"]
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["support_sender_role"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          ticket_number: number
          status: Database["public"]["Enums"]["support_ticket_state"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticket_number?: number
          status?: Database["public"]["Enums"]["support_ticket_state"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticket_number?: number
          status?: Database["public"]["Enums"]["support_ticket_state"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_user_roles: { Args: never; Returns: { role: Database["public"]["Enums"]["app_role"]; user_id: string }[] }
      admin_set_user_role: { Args: { p_role: Database["public"]["Enums"]["app_role"]; p_user_id: string }; Returns: Database["public"]["Enums"]["app_role"] }
      admin_reply_to_support_ticket: {
        Args: { p_message: string; p_resolve?: boolean; p_ticket_id: string }
        Returns: string
      }
      support_team_list_tickets: { Args: never; Returns: Json }
      support_team_reply_to_ticket: { Args: { p_message: string; p_resolve?: boolean; p_ticket_id: string }; Returns: string }
      admin_save_quiz: {
        Args: {
          p_course_id: string
          p_description: string
          p_id: string | null
          p_is_active: boolean
          p_questions: Json
          p_title: string
        }
        Returns: string
      }
      create_member_support_ticket: {
        Args: { p_message: string; p_subject: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      member_inbox_list: { Args: never; Returns: Json }
      member_inbox_mark_ticket_read: { Args: { p_ticket_id: string }; Returns: string }
      member_has_approved_access: { Args: never; Returns: boolean }
      member_quiz_questions: { Args: { p_quiz_id: string }; Returns: Json }
      reply_to_member_support_ticket: {
        Args: { p_message: string; p_ticket_id: string }
        Returns: string
      }
      submit_member_quiz: {
        Args: { p_answers: Json; p_quiz_id: string }
        Returns: {
          attempt_id: string
          score: number
          total: number
        }[]
      }
      update_member_profile: {
        Args: {
          p_age: number
          p_country: string
          p_first_name: string
          p_gender: string
          p_last_name: string
          p_phone: string
        }
        Returns: {
          age: number | null
          approval_status: Database["public"]["Enums"]["member_approval_state"]
          country: string
          created_at: string
          email: string
          email_verified_at: string | null
          first_name: string
          gender: string
          last_name: string
          phone: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "member_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user" | "staff" | "support"
      member_approval_state: "pending" | "approved" | "rejected"
      support_sender_role: "member" | "admin" | "staff" | "support"
      support_ticket_state: "open" | "awaiting_member" | "resolved"
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
      app_role: ["admin", "user", "staff", "support"],
      member_approval_state: ["pending", "approved", "rejected"],
      support_sender_role: ["member", "admin", "staff", "support"],
      support_ticket_state: ["open", "awaiting_member", "resolved"],
    },
  },
} as const
