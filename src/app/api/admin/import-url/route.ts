import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { isContentDomain } from "@/lib/content-domains";

const importSchema = z.object({
  domain: z.string().min(1),
  url: z.string().url(),
  title: z.string().optional(),
  body: z.string().optional(),
  source_name: z.string().optional(),
  preview: z.boolean().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const metadata = await fetchUrlMetadata(url);
    return NextResponse.json({ data: metadata });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "웹페이지 정보를 가져오지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const json = await request.json();
  const parsed = importSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "유효하지 않은 요청" }, { status: 400 });
  }

  const { url, preview, domain } = parsed.data;

  if (!isContentDomain(domain)) {
    return NextResponse.json({ error: "지원하지 않는 콘텐츠 도메인입니다." }, { status: 400 });
  }

  try {
    const metadata = await fetchUrlMetadata(url);
    const title = parsed.data.title?.trim() || metadata.title;
    const body = parsed.data.body?.trim() || metadata.description;
    const sourceName = parsed.data.source_name?.trim() || metadata.siteName || null;

    if (preview) {
      return NextResponse.json({
        data: {
          title,
          body,
          source_name: sourceName,
          source_url: metadata.canonicalUrl,
        },
      });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("documents").insert({
      domain,
      title,
      body,
      source_name: sourceName,
      source_url: metadata.canonicalUrl,
      is_public: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "웹사이트가 등록되었습니다.",
      data: { title, source_url: metadata.canonicalUrl },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "웹사이트 등록에 실패했습니다." },
      { status: 400 },
    );
  }
}
