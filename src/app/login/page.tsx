"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  auth_required: "관리자 페이지 접근을 위해 로그인이 필요합니다.",
  not_admin:
    "로그인은 되었지만 관리자 권한이 없습니다. Supabase SQL Editor에서 promote-admin.sql을 실행해 role을 admin으로 변경하세요.",
  signed_out: "로그아웃되었습니다. 다시 로그인해주세요.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const signedOut = searchParams.get("signed_out");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    signedOut ? errorMessages.signed_out : urlError ? (errorMessages[urlError] ?? "") : "",
  );
  const [isLoading, setIsLoading] = useState(false);

  const getClient = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMessage("환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)를 먼저 설정하세요.");
      return null;
    }
    return createSupabaseBrowserClient();
  };

  const signIn = async () => {
    const supabase = getClient();
    if (!supabase) {
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setMessage("이메일 인증이 필요합니다. 아래 '인증 메일 재전송'을 눌러 확인해주세요.");
        return;
      }
      setMessage(error.message);
      return;
    }
    setMessage("로그인 성공. 관리자 페이지로 이동합니다...");
    router.refresh();
    window.location.href = "/admin";
  };

  const signUp = async () => {
    const supabase = getClient();
    if (!supabase) {
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    setMessage(error ? error.message : "회원가입 완료. 인증 메일 확인 후 로그인하세요.");
  };

  const resendConfirmation = async () => {
    const supabase = getClient();
    if (!supabase) {
      return;
    }
    if (!email) {
      setMessage("인증 메일을 재전송하려면 이메일을 먼저 입력하세요.");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setIsLoading(false);
    setMessage(error ? error.message : "인증 메일을 다시 보냈습니다. 메일함/스팸함을 확인하세요.");
  };

  return (
    <div className="mx-auto flex w-full max-w-md px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <input
            type="email"
            placeholder="이메일"
            className="h-10 rounded-md border border-slate-300 px-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="h-10 rounded-md border border-slate-300 px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={signIn} disabled={isLoading}>
              로그인
            </Button>
            <Button type="button" variant="outline" onClick={signUp} disabled={isLoading}>
              회원가입
            </Button>
            <Button type="button" variant="ghost" onClick={resendConfirmation} disabled={isLoading}>
              인증 메일 재전송
            </Button>
            <Link href="/admin">
              <Button type="button" variant="outline" disabled={isLoading}>
                관리자 페이지(/admin)
              </Button>
            </Link>
          </div>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          <p className="text-xs text-slate-500">
            관리자 승격 SQL: <code className="rounded bg-slate-100 px-1">supabase/promote-admin.sql</code>
          </p>
          <p className="text-xs text-slate-500">
            관리자 권한이 부여된 계정은 <Link className="underline" href="/admin">/admin</Link> 으로 진입할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center text-sm text-slate-600">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
