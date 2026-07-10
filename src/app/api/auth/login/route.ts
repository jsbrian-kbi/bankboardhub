import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ensureProfileForUser, getProfileRole } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "로그인에 실패했습니다." }, { status: 401 });
  }

  await ensureProfileForUser(user.id, user.email ?? email);
  const role = await getProfileRole(user.id);

  return NextResponse.json({
    message: "로그인 성공",
    email: user.email,
    isAdmin: role === "admin",
  });
}
