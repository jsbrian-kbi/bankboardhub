import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const adminMenus = [
  { href: "/admin/news", label: "뉴스 등록" },
  { href: "/admin/regulation", label: "법규 등록" },
  { href: "/admin/precedents", label: "판례 등록" },
  { href: "/admin/supervisory-cases", label: "검사사례 등록" },
  { href: "/admin/moves", label: "인사동정 등록" },
  { href: "/admin/global-standards", label: "국제기준 등록" },
  { href: "/admin/education", label: "교육 등록" },
  { href: "/admin/banks", label: "은행정보 수정" },
  { href: "/admin/documents", label: "문서 업로드" },
  { href: "/admin/users", label: "사용자 관리" },
  { href: "/admin/boards", label: "게시판 관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-900">관리자 메뉴</h2>
        <nav className="grid gap-1 text-sm">
          {adminMenus.map((menu) => (
            <Link key={menu.href} href={menu.href} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">
              {menu.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
