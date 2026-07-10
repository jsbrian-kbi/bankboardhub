# 커스텀 도메인 연결 (Vercel)

현재 프로덕션: **https://bankboardhub.vercel.app**

예시 커스텀 도메인: `governance.example.com`

## 1) Vercel에서 도메인 추가

1. Vercel → Project → **Settings** → **Domains**
2. 도메인 입력 (예: `governance.example.com`)
3. Vercel이 안내하는 DNS 레코드 확인

일반적으로:

| Type | Name | Value |
|------|------|-------|
| CNAME | `governance` (또는 `@`) | `cname.vercel-dns.com` |

루트 도메인(`example.com`)은 DNS 업체에 따라 A 레코드 안내가 다를 수 있습니다.

## 2) Vercel 환경변수 업데이트

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://governance.example.com` |

저장 후 **Redeploy**

## 3) Supabase Auth URL 업데이트

Supabase → **Authentication** → **URL Configuration**

- **Site URL**: `https://governance.example.com`
- **Redirect URLs** 추가:
  - `https://governance.example.com/**`
  - `https://governance.example.com/auth/callback`

기존 `bankboardhub.vercel.app` URL도 당분간 유지하는 것을 권장합니다.

## 4) 검증

```bash
npm run verify:production -- https://governance.example.com
```

- `/login` → `/admin` 로그인
- `/api/health`
- `/sitemap.xml` (도메인 반영 확인)

## 5) SEO 참고

- `NEXT_PUBLIC_SITE_URL`이 sitemap/robots/metadata에 사용됩니다.
- 도메인 변경 후 Google Search Console에 새 도메인 등록을 권장합니다.
