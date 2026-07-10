import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/admin-stats";

const quickLinks = [
  { href: "/admin/news", label: "뉴스 등록" },
  { href: "/admin/regulation", label: "법규 등록" },
  { href: "/admin/documents", label: "문서 업로드" },
  { href: "/admin/banks", label: "은행 정보" },
  { href: "/admin/education", label: "교육 과정" },
  { href: "/admin/users", label: "사용자 관리" },
];

export default async function AdminPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>관리자 대시보드</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          콘텐츠 등록·목록 조회·수정·삭제를 통합 관리하는 운영 콘솔입니다. 등록한 콘텐츠는 공개 페이지에 자동 반영됩니다.
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
        <CardContent className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>배포 전 체크리스트</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700">
          <p>1. Supabase SQL 적용 완료 (schema → rls → auth-profile-trigger → storage)</p>
          <p>2. 관리자 계정 승격 완료 (promote-admin.sql)</p>
          <p>3. GitHub push 후 Vercel Import</p>
          <p>4. Vercel 환경변수 + Supabase Auth Redirect URL 설정</p>
          <p>5. 배포 후 `/api/health`, `/news`, `/search` 동작 확인</p>
          <p className="text-xs text-slate-500">
            상세 가이드: <code className="rounded bg-slate-100 px-1">docs/deployment-guide.md</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
