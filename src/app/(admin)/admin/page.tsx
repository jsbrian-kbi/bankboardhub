import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin-stats";

const quickLinks = [
  { href: "/admin/news", label: "뉴스 등록", publicHref: "/news" },
  { href: "/admin/regulation", label: "법규 등록", publicHref: "/regulation" },
  { href: "/admin/precedents", label: "판례 등록", publicHref: "/precedents" },
  { href: "/admin/supervisory-cases", label: "검사사례 등록", publicHref: "/supervisory-cases" },
  { href: "/admin/documents", label: "자료실 등록", publicHref: "/resources" },
  { href: "/admin/banks", label: "은행 정보", publicHref: "/bank-status" },
  { href: "/admin/education", label: "교육 과정", publicHref: "/education" },
  { href: "/admin/users", label: "사용자 관리", publicHref: null },
];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bankboardhub.vercel.app";

export default async function AdminPage() {
  const stats = await getAdminDashboardStats();

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
        <CardContent className="grid gap-2 text-sm text-slate-700">
          <p>1. `/admin/news` 등에서 콘텐츠 등록 후 공개 페이지 반영 확인</p>
          <p>2. `/search`와 `/ai-assistant`에서 검색·질의 테스트</p>
          <p>3. Vercel `NEXT_PUBLIC_SITE_URL` 및 Supabase Auth Redirect URL 확인</p>
          <p>4. (선택) Vercel `OPENAI_API_KEY` 설정 → AI 생성 답변 활성화</p>
          <p>5. (선택) `supabase/seed-sample.sql`로 추가 샘플 데이터 입력</p>
          <p className="text-xs text-slate-500">
            가이드: <code className="rounded bg-slate-100 px-1">docs/go-live-checklist.md</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
