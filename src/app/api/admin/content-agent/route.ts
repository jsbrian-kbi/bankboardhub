import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { isContentDomain } from "@/lib/content-domains";
import { generateContentDraft } from "@/lib/content-agent";

const requestSchema = z.object({
  message: z.string().trim().min(1),
  url: z.string().trim().optional(),
  domain: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "등록 요청 내용을 입력해주세요." }, { status: 400 });
  }

  const domainHint = parsed.data.domain && isContentDomain(parsed.data.domain) ? parsed.data.domain : undefined;
  if (parsed.data.domain && !domainHint) {
    return NextResponse.json({ error: "지원하지 않는 메뉴(domain)입니다." }, { status: 400 });
  }

  try {
    const result = await generateContentDraft({
      message: parsed.data.message,
      url: parsed.data.url,
      domainHint,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "초안 생성에 실패했습니다." },
      { status: 400 },
    );
  }
}
