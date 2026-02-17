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
      area_vibe_data: {
        Row: {
          id: string;
          area_name: string;
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
          data_source_level: 'small_area' | 'municipality' | 'no_population';
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['area_vibe_data']['Row'], 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['area_vibe_data']['Insert']>;
      };
      areas: {
        Row: {
          id: string;
          area_name: string;
          area_name_en: string | null;
          municipality_code: string;
          municipality_name: string;
          key_code: string | null;
          lat: number | null;
          lng: number | null;
          centroid: string | null;
          boundary: string | null;
          geojson: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['areas']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['areas']['Insert']>;
      };
      town_crimes: {
        Row: {
          id: string;
          area_name: string;
          name_en: string | null;
          municipality_code: string;
          municipality_name: string;
          year: number;
          total_crimes: number;
          crimes_violent: number;
          crimes_assault: number;
          crimes_theft: number;
          crimes_intellectual: number;
          crimes_other: number;
          score: number | null;
          rank: number | null;
          lat: number | null;
          lng: number | null;
          geojson: string | null;
        };
        Insert: Omit<Database['public']['Tables']['town_crimes']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['town_crimes']['Insert']>;
      };
      ugc_posts: {
        Row: {
          id: string;
          area_name_en: string;
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
