import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isStorageFileUrl } from "@/lib/content-domains";
import { getPublicDocumentById } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const article = await getPublicDocumentById(id, "news");

  if (!article) {
    notFound();
  }

  return (
    <PageShell title={article.title} description="은행·금융지주 이사회 및 사외이사 관련 뉴스 기사입니다.">
      <div className="mb-4">
        <Link href="/news" className="text-sm text-slate-600 underline">
          ← 뉴스 목록
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-2xl leading-snug">{article.title}</CardTitle>
            {article.source_name ? <Badge>{article.source_name}</Badge> : null}
          </div>
          <p className="text-sm text-slate-500">
            {article.published_at
              ? `발행일 ${article.published_at}`
              : `등록일 ${new Date(article.created_at).toLocaleDateString("ko-KR")}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{article.body}</p>
          {article.source_url ? (
            <Link
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm font-medium text-slate-900 underline"
            >
              {isStorageFileUrl(article.source_url) ? "원문 파일 보기" : "원문 웹사이트 보기"}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </PageShell>
  );
}
