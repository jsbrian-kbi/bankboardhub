import Link from "next/link";
import { topMenus } from "@/data/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDocumentsByDomain } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latestNews = await getDocumentsByDomain("news", 3);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-slate-900 px-6 py-10 text-white">
        <Badge className="bg-slate-700 text-slate-100">데이터 기반 · 실무 중심 · 거버넌스 전문</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Bank Board Governance Hub</h1>
        <p className="mt-4 max-w-3xl text-slate-200">
          한국의 은행 및 은행지주회사 사외이사, 예비 사외이사, 이사회 사무국을 위한 독립형 전문 지식 플랫폼입니다.
          법규, 감독사례, 판례, 교육, 뉴스, AI 기반 검색·질의응답을 하나의 워크스페이스에서 제공합니다.
        </p>
      </section>

      {latestNews.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">최신 뉴스</h2>
            <Link href="/news" className="text-sm text-slate-600 underline">
              전체 보기
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {latestNews.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="group block h-full">
                <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base group-hover:underline">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="line-clamp-3 text-sm text-slate-600">{item.body}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <CardHeader>
                <CardTitle>{menu.label}</CardTitle>
              </CardHeader>
              <CardContent>핵심 콘텐츠와 검색 기능으로 이사회 의사결정을 지원합니다.</CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
