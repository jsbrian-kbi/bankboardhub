import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ensureProfileForUser, getProfileRole } from "@/lib/admin-auth";

export async function getSessionWithRole() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, isAdmin: false };
    }

    if (user.email) {
      await ensureProfileForUser(user.id, user.email);
    }

    const role = await getProfileRole(user.id);

    return {
      user,
      profile: user.email
        ? {
            email: user.email,
            full_name: user.user_metadata?.full_name ?? null,
            role: role ?? "user",
          }
        : null,
      isAdmin: role === "admin",
    };
  } catch {
    return { user: null, isAdmin: false };
  }
}
