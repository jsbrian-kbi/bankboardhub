# ERD / DB / API / Directory / Deploy

## ERD 요약
- profiles (1) - (N) documents(created_by)
- documents (N) - (N) categories via document_categories
- banks, education_programs, regulatory_cases, precedents 독립 관리

## API 설계
- `GET /api/search?q=...`
  - Supabase RPC `search_documents` 호출
- `POST /api/ai-assistant`
  - 입력: `question`
  - 출력: `answer`, `sources`

## 디렉토리 구조
- `src/app/(public)/*` : 사용자 페이지
- `src/app/(admin)/admin/*` : 관리자 페이지
- `src/app/api/*` : API route
- `src/components/*` : UI/Layout 컴포넌트
- `src/lib/*` : Supabase/유틸
- `supabase/schema.sql` : DB 스키마
- `docs/*` : 기획/IA/UX/ERD 문서

## 배포 가이드

상세 문서: `docs/deployment-guide.md`

1. Supabase 프로젝트 생성 후 SQL 적용 (`schema.sql` → `rls.sql` → `auth-profile-trigger.sql` → `storage.sql`)
2. `.env.local` / Vercel 환경변수 설정
3. `npm run verify:env` → `npm run build`
4. Vercel GitHub 연동 배포
5. Supabase Auth Site URL / Redirect URLs에 Vercel 도메인 등록
6. `/api/health` 및 `/admin` 동작 확인
