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
      assignments: {
        Row: {
          author_id: string | null
          canonical_path: string | null
          common_mistakes_mdx: string | null
          concepts: string[]
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          due_at: string | null
          estimated_minutes: number | null
          id: string
          intro_mdx: string | null
          is_published: boolean
          keywords: string[]
          noindex: boolean
          og_image_public_id: string | null
          published_at: string | null
          reviewer_id: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          solutions_release_at: string
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          summary: string | null
          term: string
          title: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at: string
          updated_by: string | null
          week_id: string | null
        }
        Insert: {
          author_id?: string | null
          canonical_path?: string | null
          common_mistakes_mdx?: string | null
          concepts?: string[]
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          solutions_release_at: string
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          summary?: string | null
          term: string
          title: string
          type: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
          updated_by?: string | null
          week_id?: string | null
        }
        Update: {
          author_id?: string | null
          canonical_path?: string | null
          common_mistakes_mdx?: string | null
          concepts?: string[]
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          solutions_release_at?: string
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          summary?: string | null
          term?: string
          title?: string
          type?: Database["public"]["Enums"]["assignment_type"]
          updated_at?: string
          updated_by?: string | null
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          changed_fields: string[]
          diff: Json
          id: number
          occurred_at: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          changed_fields?: string[]
          diff?: Json
          id?: never
          occurred_at?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          changed_fields?: string[]
          diff?: Json
          id?: never
          occurred_at?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      auth_events: {
        Row: {
          anonymous_id: string | null
          created_at: string
          event_name: string
          id: number
          provider: string | null
          reason: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          event_name: string
          id?: never
          provider?: string | null
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          event_name?: string
          id?: never
          provider?: string | null
          reason?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_public_id: string | null
          bio: string | null
          created_at: string
          created_by: string | null
          credentials: string | null
          headline: string | null
          id: string
          name: string
          profile_id: string | null
          same_as: string[]
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          avatar_public_id?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          credentials?: string | null
          headline?: string | null
          id?: string
          name: string
          profile_id?: string | null
          same_as?: string[]
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          avatar_public_id?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          credentials?: string | null
          headline?: string | null
          id?: string
          name?: string
          profile_id?: string | null
          same_as?: string[]
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          canonical_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          intro_mdx: string
          is_published: boolean
          keywords: string[]
          name: string
          noindex: boolean
          og_image_public_id: string | null
          published_at: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string
          is_published?: boolean
          keywords?: string[]
          name: string
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string
          is_published?: boolean
          keywords?: string[]
          name?: string
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body_mdx: string
          canonical_path: string | null
          category_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          keywords: string[]
          last_reviewed_at: string | null
          noindex: boolean
          og_image_public_id: string | null
          program_id: string | null
          published_at: string | null
          reading_time_minutes: number
          reviewer_id: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          sources: Json
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
          word_count: number
        }
        Insert: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          keywords?: string[]
          last_reviewed_at?: string | null
          noindex?: boolean
          og_image_public_id?: string | null
          program_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          sources?: Json
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          word_count?: number
        }
        Update: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          keywords?: string[]
          last_reviewed_at?: string | null
          noindex?: boolean
          og_image_public_id?: string | null
          program_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          sources?: Json
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          path: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          path: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          path?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_feedback: {
        Row: {
          anonymous_id: string | null
          comment: string | null
          created_at: string
          entity_id: string | null
          helpful: boolean
          id: string
          page_type: string | null
          path: string
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          comment?: string | null
          created_at?: string
          entity_id?: string | null
          helpful: boolean
          id?: string
          page_type?: string | null
          path: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          comment?: string | null
          created_at?: string
          entity_id?: string | null
          helpful?: boolean
          id?: string
          page_type?: string | null
          path?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_revisions: {
        Row: {
          changed_by: string | null
          created_at: string
          id: number
          record_id: string
          revision: number
          snapshot: Json
          table_name: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: never
          record_id: string
          revision: number
          snapshot: Json
          table_name: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: never
          record_id?: string
          revision?: number
          snapshot?: Json
          table_name?: string
        }
        Relationships: []
      }
      course_programs: {
        Row: {
          course_id: string
          created_at: string
          program_id: string
          sort_order: number
        }
        Insert: {
          course_id: string
          created_at?: string
          program_id: string
          sort_order?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_programs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          aliases: string[]
          canonical_path: string | null
          code: string | null
          created_at: string
          created_by: string | null
          credits: number | null
          deleted_at: string | null
          description: string | null
          id: string
          intro_mdx: string | null
          is_published: boolean
          keywords: string[]
          name: string
          noindex: boolean
          official_url: string | null
          og_image_public_id: string | null
          program_id: string
          published_at: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          short_name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          weeks_count: number
        }
        Insert: {
          aliases?: string[]
          canonical_path?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          name: string
          noindex?: boolean
          official_url?: string | null
          og_image_public_id?: string | null
          program_id: string
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          weeks_count?: number
        }
        Update: {
          aliases?: string[]
          canonical_path?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          credits?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          name?: string
          noindex?: boolean
          official_url?: string | null
          og_image_public_id?: string | null
          program_id?: string
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          weeks_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rollups: {
        Row: {
          computed_at: string
          day: string
          dimension: string
          metric: string
          value: number
        }
        Insert: {
          computed_at?: string
          day: string
          dimension?: string
          metric: string
          value: number
        }
        Update: {
          computed_at?: string
          day?: string
          dimension?: string
          metric?: string
          value?: number
        }
        Relationships: []
      }
      downloads: {
        Row: {
          anonymous_id: string | null
          country: string | null
          created_at: string
          device_type: string | null
          file_bytes: number | null
          file_type: string | null
          id: number
          page_path: string | null
          resource_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          file_bytes?: number | null
          file_type?: string | null
          id?: never
          page_path?: string | null
          resource_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          file_bytes?: number | null
          file_type?: string | null
          id?: never
          page_path?: string | null
          resource_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          is_active: boolean
          name: string
          properties: Json
          requires_detailed_consent: boolean
          store_raw: boolean
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          is_active?: boolean
          name: string
          properties?: Json
          requires_detailed_consent?: boolean
          store_raw?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          is_active?: boolean
          name?: string
          properties?: Json
          requires_detailed_consent?: boolean
          store_raw?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          anonymous_id: string | null
          browser: string | null
          city: string | null
          consent_level: string
          country: string | null
          created_at: string
          device_type: string | null
          event_name: string
          id: number
          os: string | null
          page_view_id: string | null
          path: string | null
          properties: Json
          referrer: string | null
          region: string | null
          screen: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anonymous_id?: string | null
          browser?: string | null
          city?: string | null
          consent_level?: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name: string
          id?: never
          os?: string | null
          page_view_id?: string | null
          path?: string | null
          properties?: Json
          referrer?: string | null
          region?: string | null
          screen?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anonymous_id?: string | null
          browser?: string | null
          city?: string | null
          consent_level?: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_name?: string
          id?: never
          os?: string | null
          page_view_id?: string | null
          path?: string | null
          properties?: Json
          referrer?: string | null
          region?: string | null
          screen?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_event_name_fkey"
            columns: ["event_name"]
            isOneToOne: false
            referencedRelation: "event_definitions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_mdx: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_published: boolean
          published_at: string | null
          question: string
          scope: Database["public"]["Enums"]["faq_scope"]
          scope_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer_mdx: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          question: string
          scope?: Database["public"]["Enums"]["faq_scope"]
          scope_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer_mdx?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          question?: string
          scope?: Database["public"]["Enums"]["faq_scope"]
          scope_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          created_at: string
          created_by: string | null
          group_label: string
          group_order: number
          href: string
          id: string
          is_active: boolean
          label: string
          open_in_new_tab: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_label: string
          group_order?: number
          href: string
          id?: string
          is_active?: boolean
          label: string
          open_in_new_tab?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_label?: string
          group_order?: number
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          open_in_new_tab?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      keyword_clusters: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          intent: string | null
          notes: string | null
          path: string
          primary_keyword: string
          secondary_keywords: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          intent?: string | null
          notes?: string | null
          path: string
          primary_keyword: string
          secondary_keywords?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          intent?: string | null
          notes?: string | null
          path?: string
          primary_keyword?: string
          secondary_keywords?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lecture_videos: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          lecture: string | null
          note_course_id: string
          playlist_id: string | null
          position: number
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
          uploaded_at: string | null
          week: number | null
          youtube_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          lecture?: string | null
          note_course_id: string
          playlist_id?: string | null
          position?: number
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string | null
          week?: number | null
          youtube_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          lecture?: string | null
          note_course_id?: string
          playlist_id?: string | null
          position?: number
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string | null
          week?: number | null
          youtube_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_videos_note_course_id_fkey"
            columns: ["note_course_id"]
            isOneToOne: false
            referencedRelation: "note_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: string | null
          bytes: number | null
          caption: string | null
          created_at: string
          created_by: string | null
          credit: string | null
          delivery_type: string
          format: string | null
          height: number | null
          id: string
          public_id: string
          resource_type: string
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          updated_at: string
          updated_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          delivery_type?: string
          format?: string | null
          height?: number | null
          id?: string
          public_id: string
          resource_type?: string
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bytes?: number | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          credit?: string | null
          delivery_type?: string
          format?: string | null
          height?: number | null
          id?: string
          public_id?: string
          resource_type?: string
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          href: string
          id: string
          is_active: boolean
          label: string
          location: string
          open_in_new_tab: boolean
          parent_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          href: string
          id?: string
          is_active?: boolean
          label: string
          location?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          location?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nav_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nav_items"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          anonymous_id: string | null
          email: string
          id: string
          segment: string
          source_category: string | null
          source_entity_id: string | null
          source_path: string
          source_type: string | null
          subscribed_at: string
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          email: string
          id?: string
          segment?: string
          source_category?: string | null
          source_entity_id?: string | null
          source_path: string
          source_type?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          email?: string
          id?: string
          segment?: string
          source_category?: string | null
          source_entity_id?: string | null
          source_path?: string
          source_type?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_courses: {
        Row: {
          blog_post_id: string | null
          canonical_path: string | null
          code: string
          course_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_published: boolean
          keywords: string[]
          level: string
          name: string
          noindex: boolean
          og_image_public_id: string | null
          program_id: string
          published_at: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          short_name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blog_post_id?: string | null
          canonical_path?: string | null
          code: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          level: string
          name: string
          noindex?: boolean
          og_image_public_id?: string | null
          program_id: string
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blog_post_id?: string | null
          canonical_path?: string | null
          code?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          level?: string
          name?: string
          noindex?: boolean
          og_image_public_id?: string | null
          program_id?: string
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_courses_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string | null
          body_mdx: string
          canonical_path: string | null
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_published: boolean
          keywords: string[]
          kind: Database["public"]["Enums"]["note_kind"]
          noindex: boolean
          og_image_public_id: string | null
          published_at: string | null
          reading_time_minutes: number
          reviewed_at: string | null
          reviewer_id: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          week_id: string | null
          word_count: number
        }
        Insert: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          kind?: Database["public"]["Enums"]["note_kind"]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          reviewed_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_id?: string | null
          word_count?: number
        }
        Update: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          kind?: Database["public"]["Enums"]["note_kind"]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          reading_time_minutes?: number
          reviewed_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          week_id?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          anonymous_id: string
          browser: string | null
          city: string | null
          cls: number | null
          country: string | null
          created_at: string
          device_type: string | null
          engaged_seconds: number
          entity_id: string | null
          fcp: number | null
          id: string
          inp: number | null
          is_entry: boolean
          lcp: number | null
          max_scroll: number
          os: string | null
          page_type: string | null
          path: string
          referrer: string | null
          referrer_host: string | null
          region: string | null
          search_engine: string | null
          session_id: string | null
          title: string | null
          ttfb: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          anonymous_id: string
          browser?: string | null
          city?: string | null
          cls?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          engaged_seconds?: number
          entity_id?: string | null
          fcp?: number | null
          id: string
          inp?: number | null
          is_entry?: boolean
          lcp?: number | null
          max_scroll?: number
          os?: string | null
          page_type?: string | null
          path: string
          referrer?: string | null
          referrer_host?: string | null
          region?: string | null
          search_engine?: string | null
          session_id?: string | null
          title?: string | null
          ttfb?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          anonymous_id?: string
          browser?: string | null
          city?: string | null
          cls?: number | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          engaged_seconds?: number
          entity_id?: string | null
          fcp?: number | null
          id?: string
          inp?: number | null
          is_entry?: boolean
          lcp?: number | null
          max_scroll?: number
          os?: string | null
          page_type?: string | null
          path?: string
          referrer?: string | null
          referrer_host?: string | null
          region?: string | null
          search_engine?: string | null
          session_id?: string | null
          title?: string | null
          ttfb?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          author_id: string | null
          body_mdx: string
          canonical_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_published: boolean
          keywords: string[]
          last_reviewed_at: string | null
          noindex: boolean
          og_image_public_id: string | null
          path: string
          published_at: string | null
          reviewer_id: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          sort_order: number
          sources: Json
          summary: string | null
          template: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          last_reviewed_at?: string | null
          noindex?: boolean
          og_image_public_id?: string | null
          path: string
          published_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          sources?: Json
          summary?: string | null
          template?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          body_mdx?: string
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          keywords?: string[]
          last_reviewed_at?: string | null
          noindex?: boolean
          og_image_public_id?: string | null
          path?: string
          published_at?: string | null
          reviewer_id?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          sources?: Json
          summary?: string | null
          template?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          analytics_consent: boolean
          avatar_url: string | null
          consent_updated_at: string | null
          created_at: string
          current_term: string | null
          email: string | null
          first_seen_at: string
          full_name: string | null
          id: string
          last_seen_at: string
          marketing_consent: boolean
          onboarding_completed: boolean
          program_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          analytics_consent?: boolean
          avatar_url?: string | null
          consent_updated_at?: string | null
          created_at?: string
          current_term?: string | null
          email?: string | null
          first_seen_at?: string
          full_name?: string | null
          id: string
          last_seen_at?: string
          marketing_consent?: boolean
          onboarding_completed?: boolean
          program_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          analytics_consent?: boolean
          avatar_url?: string | null
          consent_updated_at?: string | null
          created_at?: string
          current_term?: string | null
          email?: string | null
          first_seen_at?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string
          marketing_consent?: boolean
          onboarding_completed?: boolean
          program_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          aliases: string[]
          canonical_path: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          intro_mdx: string | null
          is_published: boolean
          keywords: string[]
          name: string
          noindex: boolean
          official_url: string | null
          og_image_public_id: string | null
          published_at: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          short_name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          aliases?: string[]
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          name: string
          noindex?: boolean
          official_url?: string | null
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          aliases?: string[]
          canonical_path?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          name?: string
          noindex?: boolean
          official_url?: string | null
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id?: string
        }
        Update: {
          completed_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_papers: {
        Row: {
          contributor: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          exam: string
          exam_date: string | null
          file_name: string | null
          has_answers: boolean
          id: string
          is_published: boolean
          note: string | null
          note_course_id: string
          page_from: number | null
          page_to: number | null
          published_at: string | null
          question_count: number | null
          session: string | null
          sort_order: number
          term: string
          updated_at: string
          updated_by: string | null
          url: string
          variant: number
        }
        Insert: {
          contributor?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exam: string
          exam_date?: string | null
          file_name?: string | null
          has_answers?: boolean
          id?: string
          is_published?: boolean
          note?: string | null
          note_course_id: string
          page_from?: number | null
          page_to?: number | null
          published_at?: string | null
          question_count?: number | null
          session?: string | null
          sort_order?: number
          term: string
          updated_at?: string
          updated_by?: string | null
          url: string
          variant?: number
        }
        Update: {
          contributor?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          exam?: string
          exam_date?: string | null
          file_name?: string | null
          has_answers?: boolean
          id?: string
          is_published?: boolean
          note?: string | null
          note_course_id?: string
          page_from?: number | null
          page_to?: number | null
          published_at?: string | null
          question_count?: number | null
          session?: string | null
          sort_order?: number
          term?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
          variant?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_papers_note_course_id_fkey"
            columns: ["note_course_id"]
            isOneToOne: false
            referencedRelation: "note_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_key: Json | null
          answer_mdx: string | null
          assignment_id: string
          concept_tags: string[]
          created_at: string
          created_by: string | null
          deleted_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          explanation_mdx: string | null
          hint_mdx: string | null
          id: string
          marks: number | null
          options: Json
          position: number
          question_mdx: string
          question_type: Database["public"]["Enums"]["question_type"]
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answer_key?: Json | null
          answer_mdx?: string | null
          assignment_id: string
          concept_tags?: string[]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          explanation_mdx?: string | null
          hint_mdx?: string | null
          id?: string
          marks?: number | null
          options?: Json
          position: number
          question_mdx: string
          question_type: Database["public"]["Enums"]["question_type"]
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answer_key?: Json | null
          answer_mdx?: string | null
          assignment_id?: string
          concept_tags?: string[]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          explanation_mdx?: string | null
          hint_mdx?: string | null
          id?: string
          marks?: number | null
          options?: Json
          position?: number
          question_mdx?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          first_visited_at: string
          id: string
          last_visited_at: string
          path: string
          title: string
          user_id: string
          visit_count: number
        }
        Insert: {
          entity_id?: string | null
          entity_type?: string | null
          first_visited_at?: string
          id?: string
          last_visited_at?: string
          path: string
          title: string
          user_id?: string
          visit_count?: number
        }
        Update: {
          entity_id?: string | null
          entity_type?: string | null
          first_visited_at?: string
          id?: string
          last_visited_at?: string
          path?: string
          title?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          created_at: string
          created_by: string | null
          from_path: string
          id: string
          is_active: boolean
          notes: string | null
          status_code: number
          to_path: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_path: string
          id?: string
          is_active?: boolean
          notes?: string | null
          status_code?: number
          to_path: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_path?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          status_code?: number
          to_path?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          cloudinary_public_id: string | null
          cloudinary_resource_type: string | null
          contributor: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          download_count: number
          file_bytes: number | null
          file_format: string | null
          id: string
          is_published: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          note_course_id: string | null
          published_at: string | null
          requires_login: boolean
          sort_order: number
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url: string | null
          title: string
          updated_at: string
          updated_by: string | null
          url: string | null
          week_id: string | null
        }
        Insert: {
          cloudinary_public_id?: string | null
          cloudinary_resource_type?: string | null
          contributor?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          file_bytes?: number | null
          file_format?: string | null
          id?: string
          is_published?: boolean
          kind: Database["public"]["Enums"]["resource_kind"]
          note_course_id?: string | null
          published_at?: string | null
          requires_login?: boolean
          sort_order?: number
          source_permission: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          week_id?: string | null
        }
        Update: {
          cloudinary_public_id?: string | null
          cloudinary_resource_type?: string | null
          contributor?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          file_bytes?: number | null
          file_format?: string | null
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["resource_kind"]
          note_course_id?: string | null
          published_at?: string | null
          requires_login?: boolean
          sort_order?: number
          source_permission?: Database["public"]["Enums"]["source_permission"]
          source_url?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_note_course_id_fkey"
            columns: ["note_course_id"]
            isOneToOne: false
            referencedRelation: "note_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          anonymous_id: string | null
          clicked_path: string | null
          clicked_position: number | null
          created_at: string
          id: string
          normalized_query: string
          parsed: Json
          query: string
          results_count: number
          session_id: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          clicked_path?: string | null
          clicked_position?: number | null
          created_at?: string
          id?: string
          normalized_query: string
          parsed?: Json
          query: string
          results_count?: number
          session_id?: string | null
          source?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          clicked_path?: string | null
          clicked_position?: number | null
          created_at?: string
          id?: string
          normalized_query?: string
          parsed?: Json
          query?: string
          results_count?: number
          session_id?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_overrides: {
        Row: {
          canonical: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          noindex: boolean | null
          og_image_public_id: string | null
          path: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          canonical?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          noindex?: boolean | null
          og_image_public_id?: string | null
          path: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          canonical?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          noindex?: boolean | null
          og_image_public_id?: string | null
          path?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          anonymous_id: string
          browser: string | null
          city: string | null
          consent_level: string
          country: string | null
          device_type: string | null
          duration_seconds: number
          ended_at: string | null
          event_count: number
          id: string
          ip_hash: string | null
          is_returning: boolean
          landing_path: string | null
          last_seen_at: string
          os: string | null
          page_view_count: number
          referrer: string | null
          referrer_host: string | null
          region: string | null
          screen: string | null
          started_at: string
          traffic_source: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anonymous_id: string
          browser?: string | null
          city?: string | null
          consent_level?: string
          country?: string | null
          device_type?: string | null
          duration_seconds?: number
          ended_at?: string | null
          event_count?: number
          id: string
          ip_hash?: string | null
          is_returning?: boolean
          landing_path?: string | null
          last_seen_at?: string
          os?: string | null
          page_view_count?: number
          referrer?: string | null
          referrer_host?: string | null
          region?: string | null
          screen?: string | null
          started_at?: string
          traffic_source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anonymous_id?: string
          browser?: string | null
          city?: string | null
          consent_level?: string
          country?: string | null
          device_type?: string | null
          duration_seconds?: number
          ended_at?: string | null
          event_count?: number
          id?: string
          ip_hash?: string | null
          is_returning?: boolean
          landing_path?: string | null
          last_seen_at?: string
          os?: string | null
          page_view_count?: number
          referrer?: string | null
          referrer_host?: string | null
          region?: string | null
          screen?: string | null
          started_at?: string
          traffic_source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          data: Json
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data?: Json
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      weeks: {
        Row: {
          canonical_path: string | null
          course_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          intro_mdx: string | null
          is_published: boolean
          keywords: string[]
          noindex: boolean
          og_image_public_id: string | null
          published_at: string | null
          schema_overrides: Json
          seo_description: string | null
          seo_title: string | null
          summary: string | null
          title: string
          topics: string[]
          updated_at: string
          updated_by: string | null
          week_number: number
        }
        Insert: {
          canonical_path?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          summary?: string | null
          title: string
          topics?: string[]
          updated_at?: string
          updated_by?: string | null
          week_number: number
        }
        Update: {
          canonical_path?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          intro_mdx?: string | null
          is_published?: boolean
          keywords?: string[]
          noindex?: boolean
          og_image_public_id?: string | null
          published_at?: string | null
          schema_overrides?: Json
          seo_description?: string | null
          seo_title?: string | null
          summary?: string | null
          title?: string
          topics?: string[]
          updated_at?: string
          updated_by?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weeks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_content_performance: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          avg_engaged_seconds: number
          bounce_rate: number
          downloads: number
          helpful_no: number
          helpful_yes: number
          page_type: string
          path: string
          scroll_completion: number
          title: string
          views: number
          visitors: number
        }[]
      }
      admin_metric_series: {
        Args: {
          p_dimension?: string
          p_from: string
          p_metric: string
          p_to: string
        }
        Returns: {
          day: string
          value: number
        }[]
      }
      admin_metric_top: {
        Args: {
          p_from: string
          p_limit?: number
          p_metric: string
          p_to: string
        }
        Returns: {
          dimension: string
          value: number
        }[]
      }
      admin_movers: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          change: number
          change_pct: number
          current_views: number
          path: string
          previous_views: number
        }[]
      }
      admin_overview_totals: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      admin_refresh_rollups: {
        Args: { p_from: string; p_to: string }
        Returns: number
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_user_timeline: {
        Args: { p_before?: string; p_limit?: number; p_user_id: string }
        Returns: {
          detail: Json
          kind: string
          name: string
          occurred_at: string
          path: string
        }[]
      }
      admin_web_vitals: {
        Args: { p_from: string; p_to: string }
        Returns: {
          cls_p75: number
          fcp_p75: number
          inp_p75: number
          lcp_p75: number
          page_type: string
          samples: number
          ttfb_p75: number
        }[]
      }
      check_rate_limit: {
        Args: { p_bucket: string; p_max_hits: number; p_window_seconds: number }
        Returns: boolean
      }
      get_assignment_question_counts: {
        Args: { p_assignment_ids: string[] }
        Returns: {
          assignment_id: string
          question_count: number
        }[]
      }
      get_assignment_questions: {
        Args: { p_assignment_id: string }
        Returns: {
          answer_key: Json
          answer_mdx: string
          concept_tags: string[]
          difficulty: Database["public"]["Enums"]["difficulty"]
          explanation_mdx: string
          hint_mdx: string
          id: string
          marks: number
          options: Json
          position: number
          question_mdx: string
          question_type: Database["public"]["Enums"]["question_type"]
          solutions_released: boolean
        }[]
      }
      get_link_index: {
        Args: never
        Returns: {
          kind: string
          path: string
          summary: string
          title: string
        }[]
      }
      get_program_week_numbers: {
        Args: never
        Returns: {
          has_content: boolean
          program_slug: string
          updated_at: string
          week_number: number
        }[]
      }
      get_route_manifest: { Args: never; Returns: Json }
      get_sitemap_entries: {
        Args: never
        Returns: {
          last_modified: string
          path: string
          section: string
        }[]
      }
      get_week_content_flags: {
        Args: { p_week_ids: string[] }
        Returns: {
          has_content: boolean
          week_id: string
        }[]
      }
      ingest_events: {
        Args: { p_context: Json; p_events: Json }
        Returns: Json
      }
      record_download: {
        Args: { p_context: Json; p_resource_id: string }
        Returns: undefined
      }
      record_reading: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_path: string
          p_title: string
        }
        Returns: undefined
      }
      search_content: {
        Args: {
          p_course_id?: string
          p_kind?: string
          p_limit?: number
          p_query: string
          p_week?: number
        }
        Returns: {
          entity_type: string
          kind: string
          path: string
          rank: number
          snippet: string
          subtitle: string
          title: string
          week_number: number
        }[]
      }
      staff_refresh_search_index: { Args: never; Returns: boolean }
    }
    Enums: {
      assignment_type: "graded" | "practice" | "activity"
      difficulty: "easy" | "medium" | "hard"
      faq_scope:
        | "global"
        | "program"
        | "course"
        | "week"
        | "assignment"
        | "page"
      note_kind: "week" | "topic" | "formula_sheet" | "exam_prep"
      question_type: "mcq" | "msq" | "numeric" | "text"
      resource_kind: "pdf" | "sheet" | "link" | "video"
      source_permission: "original" | "permission_granted" | "official_link"
      user_role: "student" | "editor" | "admin"
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
      assignment_type: ["graded", "practice", "activity"],
      difficulty: ["easy", "medium", "hard"],
      faq_scope: ["global", "program", "course", "week", "assignment", "page"],
      note_kind: ["week", "topic", "formula_sheet", "exam_prep"],
      question_type: ["mcq", "msq", "numeric", "text"],
      resource_kind: ["pdf", "sheet", "link", "video"],
      source_permission: ["original", "permission_granted", "official_link"],
      user_role: ["student", "editor", "admin"],
    },
  },
} as const
