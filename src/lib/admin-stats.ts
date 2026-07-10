import { createAdminClient } from "@/lib/supabase-admin";

export interface AdminDashboardStats {
  documents: number;
  news: number;
  banks: number;
  education: number;
  users: number;
  admins: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createAdminClient();

  const [documents, news, banks, education, profiles] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("domain", "news"),
    supabase.from("banks").select("id", { count: "exact", head: true }),
    supabase.from("education_programs").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id, role"),
  ]);

  const profileRows = profiles.data ?? [];

  return {
    documents: documents.count ?? 0,
    news: news.count ?? 0,
    banks: banks.count ?? 0,
    education: education.count ?? 0,
    users: profileRows.length,
    admins: profileRows.filter((row) => row.role === "admin").length,
  };
}
