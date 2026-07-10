# Vercel 배포 빠른 가이드

GitHub 저장소: https://github.com/jsbrian-kbi/bankboardhub

## 1) Vercel Dashboard 배포 (권장)

1. https://vercel.com/new 접속 후 GitHub 로그인
2. **Import Git Repository** → `jsbrian-kbi/bankboardhub` 선택
3. Framework Preset: **Next.js** (자동 감지)
4. **Environment Variables**에 아래 4개 필수 입력

| 변수명 | 값 (로컬 `.env.local`에서 복사) |
|--------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `NEXT_PUBLIC_SITE_URL` | `https://bankboardhub.vercel.app` |

선택:
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4o-mini`

5. **Deploy** 클릭
6. 배포 완료 URL: **https://bankboardhub.vercel.app**

## 2) 배포 직후 Supabase Auth 설정

Supabase Dashboard → **Authentication** → **URL Configuration**

- **Site URL**: `https://<vercel-배포-url>`
- **Redirect URLs** 추가:
  - `https://<vercel-배포-url>/**`
  - `https://<vercel-배포-url>/auth/callback`

## 3) Vercel 환경변수 업데이트 (SITE_URL)

배포 URL이 확정되면 Vercel → Project → **Settings** → **Environment Variables**

- `NEXT_PUBLIC_SITE_URL` = `https://<vercel-배포-url>`
- 저장 후 **Deployments** → 최신 배포 **Redeploy**

## 4) 배포 검증

```text
https://<vercel-배포-url>/api/health
https://<vercel-배포-url>/login
https://<vercel-배포-url>/admin
https://<vercel-배포-url>/news
```

## 5) CLI 배포 (선택)

```bash
cd /Users/admin/bankboardhub
npx vercel login
npx vercel
npx vercel --prod
```

CLI 로그인 시 브라우저에서 Vercel 계정 인증이 필요합니다.

## 6) 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| 빌드 실패 (env) | Vercel에 Supabase 3개 키 재확인 |
| 로그인 후 /admin 불가 | Supabase `profiles.role=admin` 확인 |
| 이메일 인증 실패 | Supabase Redirect URL에 `/auth/callback` 추가 |
| 관리자 API 403 | 프로덕션에서도 admin 계정 승격 SQL 실행 |
