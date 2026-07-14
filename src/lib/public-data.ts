import { createAdminClient } from "@/lib/supabase-admin";

export interface PublicDocument {
  id: number;
  domain: string;
  title: string;
  body: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface PublicBank {
  id: number;
  name: string;
  board_size: number | null;
  outside_director_count: number | null;
  female_ratio: number | null;
  term_status: string | null;
}

export interface PublicEducation {
  id: number;
  title: string;
  track: string;
  starts_at: string | null;
  ends_at: string | null;
  application_deadline: string | null;
  capacity: number | null;
  description: string | null;
}

export async function getDocumentsByDomain(domain: string, limit = 50): Promise<PublicDocument[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, domain, title, body, source_name, source_url, published_at, created_at")
    .eq("domain", domain)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`getDocumentsByDomain(${domain}):`, error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicDocumentById(id: number, domain?: string): Promise<PublicDocument | null> {
  if (!Number.isFinite(id) || id <= 0) return null;

  const supabase = createAdminClient();
  let query = supabase
    .from("documents")
    .select("id, domain, title, body, source_name, source_url, published_at, created_at")
    .eq("id", id)
    .eq("is_public", true);

  if (domain) {
    query = query.eq("domain", domain);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(`getPublicDocumentById(${id}):`, error.message);
    return null;
  }

  return data;
}

export async function getBanks(): Promise<PublicBank[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banks")
    .select("id, name, board_size, outside_director_count, female_ratio, term_status")
    .order("name", { ascending: true });

  if (error) {
    console.error("getBanks:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getEducationPrograms(): Promise<PublicEducation[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("education_programs")
    .select("id, title, track, starts_at, ends_at, application_deadline, capacity, description")
    .order("starts_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("getEducationPrograms:", error.message);
    return [];
  }

  return data ?? [];
}
