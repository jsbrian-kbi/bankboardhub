"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { topMenus } from "@/data/navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="메뉴 열기"
        className="rounded-md p-1 text-slate-700"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">메뉴</p>
              <button type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <nav className="grid gap-1">
              {topMenus.map((menu) => (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {menu.label}
                </Link>
              ))}
              <Link
                href="/search"
                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                통합 검색
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
