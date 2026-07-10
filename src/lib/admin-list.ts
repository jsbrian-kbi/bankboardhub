import { createAdminClient } from "@/lib/supabase-admin";

export async function getAdminContent(domain: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, domain, title, body, source_name, source_url, published_at, created_at")
    .eq("domain", domain)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getAdminBanks() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banks")
    .select("id, name, board_size, outside_director_count, female_ratio, term_status, updated_at")
    .order("name", { ascending: true });

  return error ? [] : (data ?? []);
}

export async function getAdminEducation() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("education_programs")
    .select("id, title, track, starts_at, ends_at, application_deadline, capacity, description, created_at")
    .order("created_at", { ascending: false });

  return error ? [] : (data ?? []);
}

export async function getAdminProfiles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, organization, created_at")
    .order("created_at", { ascending: false });

  return error ? [] : (data ?? []);
}
