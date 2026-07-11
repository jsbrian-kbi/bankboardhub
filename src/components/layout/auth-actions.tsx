"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

interface AuthActionsProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  email?: string | null;
}

export function AuthActions({ isLoggedIn, isAdmin, email }: AuthActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async () => {
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // 서버 라우트에서 세션 쿠키를 정리합니다.
    }

    window.location.href = "/auth/signout";
  };

  if (!isLoggedIn) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          로그인
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {email ? <span className="hidden text-xs text-slate-500 xl:inline">{email}</span> : null}
      {isAdmin ? (
        <>
          <Link href="/admin/content-agent">
            <Button variant="outline" size="sm">
              AI 등록
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="sm">관리자</Button>
          </Link>
        </>
      ) : null}
      <Button type="button" variant="ghost" size="sm" onClick={signOut} disabled={isLoading}>
        {isLoading ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );
}
