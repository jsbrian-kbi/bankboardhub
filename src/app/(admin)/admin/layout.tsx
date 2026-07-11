import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_MENUS } from "@/data/admin-menus";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-900">관리자 메뉴</h2>
        <nav className="grid gap-1 text-sm">
          {ADMIN_MENUS.map((menu) => (
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
