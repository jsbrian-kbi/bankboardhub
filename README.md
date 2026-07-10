# Bank Board Governance Hub

국내 은행 및 은행지주회사 이사회·사외이사를 위한 독립형 거버넌스 지식 플랫폼입니다.

## 주요 기능

- 13개 핵심 메뉴 (이사회, 사외이사, 위원회, 법규, 감독사례, 판례, 국제기준 등)
- 관리자 CRUD 콘솔 (`/admin`)
- Supabase PostgreSQL + Full Text Search
- AI Board Assistant (RAG + OpenAI)
- 파일 업로드 (Supabase Storage)

## 기술 스택

- Next.js 16, TypeScript, Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage)
- OpenAI API (선택)

## 빠른 시작 (로컬)

```bash
npm install
cp .env.example .env.local
# .env.local에 Supabase 키 입력
npm run verify:env
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Supabase SQL 적용 순서:

1. `supabase/schema.sql`
2. `supabase/rls.sql`
3. `supabase/auth-profile-trigger.sql`
4. `supabase/storage.sql`

관리자 승격: `supabase/promote-admin.sql`

## 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## 프로덕션

- **사이트**: https://bankboardhub.vercel.app
- **관리자**: https://bankboardhub.vercel.app/admin
- **검증**: `npm run verify:production -- https://bankboardhub.vercel.app`

Go-Live 체크리스트: [docs/go-live-checklist.md](docs/go-live-checklist.md)

## 배포

상세 가이드: [docs/deployment-guide.md](docs/deployment-guide.md)

```bash
npm run deploy:preflight
```

요약:

1. Supabase SQL 적용 (schema → rls → auth-profile-trigger → storage → fix-rls-recursion)
2. GitHub push 완료: https://github.com/jsbrian-kbi/bankboardhub
3. Vercel Import + 환경변수 설정 → Deploy ([vercel-quickstart.md](docs/vercel-quickstart.md))
4. Supabase Auth Redirect URL에 `/auth/callback` 등록
5. `/api/health` 및 `/admin` 동작 확인

## 문서

- [서비스 기획서](docs/service-plan.md)
- [IA / Sitemap](docs/ia-sitemap-userflow.md)
- [Auth / RAG 가이드](docs/rag-and-auth-guide.md)
- [배포 가이드](docs/deployment-guide.md)
- [Vercel 빠른 가이드](docs/vercel-quickstart.md)
- [Supabase 프로덕션 Auth](docs/supabase-production-auth.md)
- [Go-Live 체크리스트](docs/go-live-checklist.md)

## 라이선스

Private — All rights reserved.
