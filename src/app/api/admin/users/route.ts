import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-admin";

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(["user", "admin"]),
  organization: z.string().optional(),
});

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, organization, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { email, full_name, role, organization } = parsed.data;

  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const user = userData.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: "해당 이메일의 auth 사용자가 없습니다." }, { status: 404 });
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email,
    full_name,
    role,
    organization: organization || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "사용자 권한이 저장되었습니다." });
}
