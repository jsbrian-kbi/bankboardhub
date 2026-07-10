import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function getSessionWithRole() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile,
    isAdmin: profile?.role === "admin",
  };
}
