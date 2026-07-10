# Supabase 프로덕션 Auth URL 설정

Vercel 배포 URL: **https://bankboardhub.vercel.app**

## 설정 위치

Supabase Dashboard → **Authentication** → **URL Configuration**

## 입력 값

| 항목 | 값 |
|------|-----|
| **Site URL** | `https://bankboardhub.vercel.app` |
| **Redirect URLs** | 아래 4줄 각각 추가 |

```
https://bankboardhub.vercel.app/**
https://bankboardhub.vercel.app/auth/callback
http://127.0.0.1:3000/**
http://127.0.0.1:3000/auth/callback
```

## Vercel 환경변수 (배포 URL 확정 후)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://bankboardhub.vercel.app` |

저장 후 Vercel에서 **Redeploy** 실행.

## 프로덕션 검증

```bash
npm run verify:production -- https://bankboardhub.vercel.app
```

## 관리자 로그인 (프로덕션)

로컬과 동일 계정으로 로그인 가능. `profiles.role = 'admin'` 이어야 `/admin` 접근 가능.

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL@example.com';
```
