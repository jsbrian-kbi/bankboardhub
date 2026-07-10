import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";

  let results: Array<{
    id: number;
    domain: string;
    title: string;
    snippet: string;
    rank: number;
  }> = [];
  let errorMessage = "";

  if (keyword) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("search_documents", {
      keyword,
      match_count: 20,
    });

    if (error) {
      errorMessage = error.message;
    } else {
      results = data ?? [];
    }
  }

  return (
    <PageShell title="통합 검색" description="법규·판례·뉴스·검사사례·자료를 키워드로 검색합니다.">
      <form action="/search" method="get" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={keyword}
          placeholder="검색어를 입력하세요"
          className="h-11 flex-1 rounded-md border border-slate-300 px-3"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 text-sm text-white">
          검색
        </button>
      </form>

      {!keyword ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            검색어를 입력해 주세요. 예: 내부통제, 사외이사, 감사위원회
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-red-600">{errorMessage}</CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            &quot;{keyword}&quot;에 대한 검색 결과가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600">검색어 &quot;{keyword}&quot; — {results.length}건</p>
          {results.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Badge>{item.domain}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-700">{item.snippet}</p>
                <Link href={`/${domainToPath(item.domain)}`} className="mt-3 inline-block text-sm underline">
                  관련 섹션 보기
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function domainToPath(domain: string) {
  const map: Record<string, string> = {
    news: "news",
    precedent: "precedents",
    "supervisory-case": "supervisory-cases",
    resources: "resources",
    regulation: "regulation",
    move: "moves",
    "global-standard": "global-standards",
  };
  return map[domain] ?? "search";
}
