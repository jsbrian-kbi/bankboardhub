export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "user" | "admin";
          organization: string | null;
          created_at: string;
        };
      };
      documents: {
        Row: {
          id: number;
          domain: string;
          title: string;
          body: string;
          source_name: string | null;
          source_url: string | null;
          published_at: string | null;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      banks: {
        Row: {
          id: number;
          name: string;
          board_size: number | null;
          outside_director_count: number | null;
          committee_summary: Json | null;
          female_ratio: number | null;
          expertise_summary: Json | null;
          term_status: string | null;
          updated_at: string;
        };
      };
      education_programs: {
        Row: {
          id: number;
          title: string;
          track: string;
          starts_at: string | null;
          ends_at: string | null;
          application_deadline: string | null;
          capacity: number | null;
          description: string | null;
          created_at: string;
        };
      };
    };
  };
}
