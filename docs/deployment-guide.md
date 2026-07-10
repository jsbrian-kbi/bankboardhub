# Bank Board Governance Hub — 배포 가이드 (Vercel + Supabase)

## 0) 배포 전 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] SQL 적용: `schema.sql` → `rls.sql` → `auth-profile-trigger.sql` → `storage.sql`
- [ ] 관리자 계정 승격 (`promote-admin.sql` 또는 `fix-profile-id-mismatch.sql`)
- [ ] GitHub 저장소에 코드 push
- [ ] Vercel 환경변수 설정
- [ ] Supabase Auth URL/Redirect 설정
- [ ] 프로덕션 URL에서 로그인·관리자·검색·AI 테스트

---

## 1) Supabase 프로덕션 준비

### SQL 실행 순서 (SQL Editor)

1. `supabase/schema.sql`
2. `supabase/rls.sql`
3. `supabase/auth-profile-trigger.sql`
4. `supabase/storage.sql`
5. (선택) `supabase/seed-sample.sql`

### 관리자 계정

```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```

`auth.users.id`와 `profiles.id`가 다르면 `supabase/fix-profile-id-mismatch.sql` 실행.

---

## 2) GitHub 연동

```bash
cd /Users/admin/bankboardhub
git add .
git commit -m "Prepare Bank Board Governance Hub for deployment"
git remote add origin https://github.com/<your-org>/bankboardhub.git
git push -u origin main
```

---

## 3) Vercel 배포

### Dashboard

1. [vercel.com/new](https://vercel.com/new)
2. GitHub 저장소 Import
3. Framework: **Next.js**
4. Environment Variables 설정
5. **Deploy**

### CLI

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

---

## 4) Vercel 환경변수

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (서버 전용) |
| `OPENAI_API_KEY` | AI (선택) |
| `OPENAI_MODEL` | 예: gpt-4o-mini |
| `NEXT_PUBLIC_SITE_URL` | 프로덕션 URL (SEO/sitemap) |

로컬 검증: `npm run verify:env`

---

## 5) Supabase Auth URL

Dashboard → Authentication → URL Configuration

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: `https://<your-app>.vercel.app/**`, `http://localhost:3000/**`

---

## 6) 배포 후 검증

```
GET https://<your-app>.vercel.app/api/health
```

기능 테스트: `/login` → `/admin` → 콘텐츠 등록 → `/news` → `/search` → `/ai-assistant`

---

## 7) 문제 해결

| 증상 | 해결 |
|------|------|
| /admin 불가 | profiles.role=admin, id 일치 |
| 이메일 인증 실패 | Site URL/Redirect URLs |
| 업로드 실패 | storage.sql, resources 버킷 |
| env 오류 | Vercel Redeploy |
