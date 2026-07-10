import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { isContentDomain } from "@/lib/content-domains";
import { formatZodError, normalizeWebsiteUrl, websiteImportSchema } from "@/lib/admin-content-schema";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const rawUrl = new URL(request.url).searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const url = normalizeWebsiteUrl(rawUrl);
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
  const parsed = websiteImportSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { preview, domain } = parsed.data;

  if (!isContentDomain(domain)) {
    return NextResponse.json({ error: "지원하지 않는 콘텐츠 도메인입니다." }, { status: 400 });
  }

  try {
    const url = normalizeWebsiteUrl(parsed.data.url);
    const metadata = await fetchUrlMetadata(url);
    const title = parsed.data.title || metadata.title || new URL(url).hostname;
    const body = parsed.data.body || metadata.description || `${title} 웹페이지`;
    const sourceName = parsed.data.source_name || metadata.siteName || null;

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
