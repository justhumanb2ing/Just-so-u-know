export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null;
          accessTokenExpiresAt: string | null;
          accountId: string;
          createdAt: string;
          id: string;
          idToken: string | null;
          password: string | null;
          providerId: string;
          refreshToken: string | null;
          refreshTokenExpiresAt: string | null;
          scope: string | null;
          updatedAt: string;
          userId: string;
        };
        Insert: {
          accessToken?: string | null;
          accessTokenExpiresAt?: string | null;
          accountId: string;
          createdAt?: string;
          id: string;
          idToken?: string | null;
          password?: string | null;
          providerId: string;
          refreshToken?: string | null;
          refreshTokenExpiresAt?: string | null;
          scope?: string | null;
          updatedAt: string;
          userId: string;
        };
        Update: {
          accessToken?: string | null;
          accessTokenExpiresAt?: string | null;
          accountId?: string;
          createdAt?: string;
          id?: string;
          idToken?: string | null;
          password?: string | null;
          providerId?: string;
          refreshToken?: string | null;
          refreshTokenExpiresAt?: string | null;
          scope?: string | null;
          updatedAt?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      item_size: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      item_type: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      page: {
        Row: {
          bio: string | null;
          created_at: string;
          handle: string;
          id: string;
          image: string | null;
          is_primary: boolean;
          is_public: boolean;
          name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          handle: string;
          id?: string;
          image?: string | null;
          is_primary?: boolean;
          is_public?: boolean;
          name?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          handle?: string;
          id?: string;
          image?: string | null;
          is_primary?: boolean;
          is_public?: boolean;
          name?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      page_item: {
        Row: {
          created_at: string;
          data: Json;
          id: string;
          is_visible: boolean;
          lock_version: number;
          order_key: number;
          page_id: string;
          size_code: Database["public"]["Enums"]["page_item_size"];
          type_code: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          id?: string;
          is_visible?: boolean;
          lock_version?: number;
          order_key: number;
          page_id: string;
          size_code?: Database["public"]["Enums"]["page_item_size"];
          type_code: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          id?: string;
          is_visible?: boolean;
          lock_version?: number;
          order_key?: number;
          page_id?: string;
          size_code?: Database["public"]["Enums"]["page_item_size"];
          type_code?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_item_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "page";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_item_type_code_fkey";
            columns: ["type_code"];
            isOneToOne: false;
            referencedRelation: "item_type";
            referencedColumns: ["code"];
          },
        ];
      };
      page_social_items: {
        Row: {
          created_at: string;
          id: string;
          is_visible: boolean;
          page_id: string;
          platform: string;
          sort_order: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          page_id: string;
          platform: string;
          sort_order?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          page_id?: string;
          platform?: string;
          sort_order?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_social_items_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "page";
            referencedColumns: ["id"];
          },
        ];
      };
      session: {
        Row: {
          createdAt: string;
          expiresAt: string;
          id: string;
          ipAddress: string | null;
          token: string;
          updatedAt: string;
          userAgent: string | null;
          userId: string;
        };
        Insert: {
          createdAt?: string;
          expiresAt: string;
          id: string;
          ipAddress?: string | null;
          token: string;
          updatedAt: string;
          userAgent?: string | null;
          userId: string;
        };
        Update: {
          createdAt?: string;
          expiresAt?: string;
          id?: string;
          ipAddress?: string | null;
          token?: string;
          updatedAt?: string;
          userAgent?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          createdAt: string;
          email: string;
          emailVerified: boolean;
          id: string;
          image: string | null;
          name: string;
          role: string | null;
          updatedAt: string;
          userMetadata: Json | null;
        };
        Insert: {
          createdAt?: string;
          email: string;
          emailVerified: boolean;
          id: string;
          image?: string | null;
          name: string;
          role?: string | null;
          updatedAt?: string;
          userMetadata?: Json | null;
        };
        Update: {
          createdAt?: string;
          email?: string;
          emailVerified?: boolean;
          id?: string;
          image?: string | null;
          name?: string;
          role?: string | null;
          updatedAt?: string;
          userMetadata?: Json | null;
        };
        Relationships: [];
      };
      verification: {
        Row: {
          createdAt: string;
          expiresAt: string;
          id: string;
          identifier: string;
          updatedAt: string;
          value: string;
        };
        Insert: {
          createdAt?: string;
          expiresAt: string;
          id: string;
          identifier: string;
          updatedAt?: string;
          value: string;
        };
        Update: {
          createdAt?: string;
          expiresAt?: string;
          id?: string;
          identifier?: string;
          updatedAt?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_memo_item_for_owned_page: {
        Args: { p_content: string; p_handle: string; p_user_id: string };
        Returns: {
          created_at: string;
          data: Json;
          id: string;
          is_visible: boolean;
          lock_version: number;
          order_key: number;
          page_id: string;
          size_code: Database["public"]["Enums"]["page_item_size"];
          type_code: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "page_item";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_page_for_user: {
        Args: {
          p_bio?: string;
          p_handle: string;
          p_image?: string;
          p_is_public?: boolean;
          p_name?: string;
          p_user_id: string;
        };
        Returns: {
          bio: string | null;
          created_at: string;
          handle: string;
          id: string;
          image: string | null;
          is_primary: boolean;
          is_public: boolean;
          name: string | null;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "page";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      page_item_size: "wide-short" | "wide-tall" | "wide-full";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      page_item_size: ["wide-short", "wide-tall", "wide-full"],
    },
  },
} as const;
