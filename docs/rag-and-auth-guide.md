# Auth / RBAC / RAG 연동 가이드

## 1) Auth + RBAC
- `/login` 페이지에서 이메일/비밀번호 로그인 및 회원가입
- `/admin/*`, `/api/admin/*`는 middleware로 보호
- 서버 컴포넌트에서도 `requireAdmin()` 이중검증

## 2) Supabase SQL 적용 순서
1. `supabase/schema.sql` 실행
2. `supabase/rls.sql` 실행
3. `supabase/auth-profile-trigger.sql` 실행 (회원가입 시 `profiles` 자동 생성)
4. 관리자로 승격할 사용자 이메일을 `profiles.role='admin'`으로 변경

## 3) 관리자 CRUD 엔드포인트
- `/api/admin/content` : 문서형 콘텐츠(뉴스/판례/검사사례)
- `/api/admin/banks` : 은행 현황 upsert
- `/api/admin/education` : 교육과정 등록
- `/api/admin/users` : 사용자 role 관리
- `/api/admin/documents` : 자료실 문서 메타 등록
- `/api/admin/board-posts` : 게시판 설정 메타 등록

## 4) RAG 파이프라인
- 검색 API: `GET /api/rag/search?q=...`
- AI Assistant: `POST /api/ai-assistant`
  - 1단계: Supabase FTS로 관련 문서 검색
  - 2단계: `OPENAI_API_KEY`가 있으면 근거 기반 LLM 답변 생성
  - 없으면 검색 기반 요약 응답

## 5) 파일 업로드 (Storage)
1. `supabase/storage.sql` 실행 (또는 Dashboard에서 `resources` public 버킷 생성)
2. `/admin/documents`에서 파일 업로드
3. `/resources` 공개 페이지에서 다운로드 링크 확인

## 6) 가입/로그인 운영 팁
- 이메일 인증 오류가 발생하면 `/login`의 `인증 메일 재전송` 버튼 사용
- 인증 완료 후 로그인하여 `/admin` 접근
- `/admin` 접근이 거부되면 `public.profiles.role='admin'` 여부 확인
