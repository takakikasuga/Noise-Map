/**
 * Supabase データベース型定義
 * TODO: supabase gen types typescript で自動生成する
 */
export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string;
          name: string;
          name_en: string;
          location: unknown;
          lat: number;
          lng: number;
          municipality_code: string;
          municipality_name: string;
          lines: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stations']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stations']['Insert']>;
      };
      safety_scores: {
        Row: {
          id: string;
          station_id: string;
          year: number;
          month: number | null;
          total_crimes: number;
          crimes_violent: number;
          crimes_assault: number;
          crimes_theft: number;
          crimes_intellectual: number;
          crimes_other: number;
          score: number;
          rank: number | null;
          previous_year_total: number | null;
          data_granularity: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['safety_scores']['Row'], 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['safety_scores']['Insert']>;
      };
      hazard_data: {
        Row: {
          id: string;
          station_id: string;
          flood_level: string;
          flood_depth_max: number | null;
          landslide_warning: boolean;
          landslide_special: boolean;
          tsunami_level: string;
          tsunami_depth_max: number | null;
          liquefaction_risk: string;
          score: number;
          rank: number | null;
          flood_score: number;
          landslide_score: number;
          tsunami_score: number;
          liquefaction_score: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hazard_data']['Row'], 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['hazard_data']['Insert']>;
      };
      vibe_data: {
        Row: {
          id: string;
          station_id: string;
          population_young_ratio: number | null;
          population_family_ratio: number | null;
          population_elderly_ratio: number | null;
          daytime_population_ratio: number | null;
          single_household_ratio: number | null;
          restaurant_count: number;
          convenience_store_count: number;
          park_count: number;
          school_count: number;
          hospital_count: number;
          tags: string[];
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vibe_data']['Row'], 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vibe_data']['Insert']>;
      };
      ugc_posts: {
        Row: {
          id: string;
          station_id: string;
          content: string;
          category: string;
          rating: number | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ugc_posts']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ugc_posts']['Insert']>;
      };
    };
  };
}
