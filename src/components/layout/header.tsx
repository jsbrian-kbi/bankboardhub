import Link from "next/link";
import { topMenus } from "@/data/navigation";
import { getSessionWithRole } from "@/lib/session";
import { GlobalSearch } from "@/components/layout/global-search";
import { AuthActions } from "@/components/layout/auth-actions";
import { MobileNav } from "@/components/layout/mobile-nav";

export async function Header() {
  const { user, isAdmin } = await getSessionWithRole();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-wide text-slate-900">
          Bank Board Governance Hub
        </Link>
        <nav className="hidden gap-4 text-sm text-slate-600 lg:flex">
          {topMenus.slice(0, 6).map((menu) => (
            <Link key={menu.href} href={menu.href} className="hover:text-slate-900">
              {menu.label}
            </Link>
          ))}
        </nav>
        <GlobalSearch />
        <AuthActions isLoggedIn={!!user} isAdmin={isAdmin} email={user?.email} />
        <MobileNav />
      </div>
    </header>
  );
}
