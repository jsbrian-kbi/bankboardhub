import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin-stats";
import { getSiteUrl } from "@/lib/site-url";

const quickLinks = [
  { href: "/admin/content-agent", label: "AI 등록 도우미", publicHref: null },
  { href: "/admin/news", label: "뉴스 등록", publicHref: "/news" },
  { href: "/admin/regulation", label: "법규 등록", publicHref: "/regulation" },
  { href: "/admin/precedents", label: "판례 등록", publicHref: "/precedents" },
  { href: "/admin/supervisory-cases", label: "검사사례 등록", publicHref: "/supervisory-cases" },
  { href: "/admin/documents", label: "자료실 등록", publicHref: "/resources" },
  { href: "/admin/banks", label: "은행 정보", publicHref: "/bank-status" },
  { href: "/admin/education", label: "교육 과정", publicHref: "/education" },
  { href: "/admin/users", label: "사용자 관리", publicHref: null },
];

const supabaseAuthUrl =
  "https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc/auth/url-configuration";

export default async function AdminPage() {
  const stats = await getAdminDashboardStats();
  const siteUrl = getSiteUrl();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>관리자 대시보드</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700">
          <p>콘텐츠 등록·수정·삭제를 관리하는 운영 콘솔입니다. 등록한 내용은 공개 사이트에 자동 반영됩니다.</p>
          <p>
            프로덕션 사이트:{" "}
            <a href={siteUrl} className="text-slate-900 underline" target="_blank" rel="noreferrer">
              {siteUrl}
            </a>
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "전체 문서", value: stats.documents },
          { label: "뉴스", value: stats.news },
          { label: "은행 현황", value: stats.banks },
          { label: "교육 과정", value: stats.education },
          { label: "사용자", value: stats.users },
          { label: "관리자", value: stats.admins },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {quickLinks.map((link) => (
            <div key={link.href} className="flex flex-wrap items-center gap-2">
              <Link
                href={link.href}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
              {link.publicHref ? (
                <a
                  href={`${siteUrl}${link.publicHref}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 underline"
                >
                  공개 페이지 보기
                </a>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>운영 체크리스트</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-700">
          <div className="grid gap-1">
            <p className="font-medium text-slate-900">완료됨</p>
            <p>✅ 프로덕션 배포 · Health · OpenAI · sitemap</p>
            <p>✅ 메뉴별 문서·웹사이트 업로드 · AI Assistant</p>
          </div>
          <div className="grid gap-1">
            <p className="font-medium text-slate-900">남은 확인</p>
            <p>
              1.{" "}
              <a href={supabaseAuthUrl} target="_blank" rel="noreferrer" className="underline">
                Supabase Auth URL
              </a>
              에 Site URL · Redirect URL(`/auth/callback`) 등록
            </p>
            <p>2. `/admin/news` 등에서 콘텐츠 등록 → 공개 페이지 반영 확인</p>
            <p>3. `/search`, `/ai-assistant`에서 검색·질의 테스트</p>
          </div>
          <p className="text-xs text-slate-500">
            검증: <code className="rounded bg-slate-100 px-1">npm run verify:production -- {siteUrl}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
