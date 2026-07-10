import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function getProfileRole(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role ?? null;
}

export async function ensureProfileForUser(userId: string, email: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id: userId,
      email,
      full_name: email.split("@")[0] || "user",
      role: "user",
    });
  }
}

export async function requireAdminApi() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  if (user.email) {
    await ensureProfileForUser(user.id, user.email);
  }

  const role = await getProfileRole(user.id);
  if (role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 }),
    };
  }

  return { user, response: null };
}

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?error=auth_required");
  }

  if (user.email) {
    await ensureProfileForUser(user.id, user.email);
  }

  const role = await getProfileRole(user.id);
  if (role !== "admin") {
    redirect("/login?error=not_admin");
  }

  return user;
}
