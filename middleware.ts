import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isApiRoute) {
      return NextResponse.json({ error: "서버 환경변수(Supabase)가 설정되지 않았습니다." }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login?error=config_missing", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (isApiRoute) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "auth_required");
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
        redirectResponse.cookies.set(name, value);
      });
      return redirectResponse;
    }

    return supabaseResponse;
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "인증 서버에 연결할 수 없습니다." }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/login?error=auth_unavailable", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
