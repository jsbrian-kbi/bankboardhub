# Auth / RBAC / RAG 연동 가이드

## 1) Auth + RBAC
- `/login` 페이지에서 이메일/비밀번호 로그인 및 회원가입
- `/admin/*`, `/api/admin/*`는 middleware로 보호
- 서버 컴포넌트에서도 `requireAdmin()` 이중검증

## 2) Supabase SQL 적용 순서
1. `supabase/schema.sql` 실행
2. `supabase/rls.sql` 실행
3. `supabase/auth-profile-trigger.sql` 실행 (회원가입 시 `profiles` 자동 생성)
4. `supabase/storage.sql` 실행 (자료실 업로드)
5. `supabase/rag-vector.sql` 실행 (pgvector RAG — Extensions에서 `vector` 먼저 활성화)
6. 관리자로 승격할 사용자 이메일을 `profiles.role='admin'`으로 변경
7. `npm run index:rag` 로 기존 문서 벡터 색인

## 3) 관리자 CRUD 엔드포인트
- `/api/admin/content` : 문서형 콘텐츠(뉴스/판례/검사사례)
- `/api/admin/banks` : 은행 현황 upsert
- `/api/admin/education` : 교육과정 등록
- `/api/admin/users` : 사용자 role 관리
- `/api/admin/documents` : 자료실 문서 메타 등록
- `/api/admin/board-posts` : 게시판 설정 메타 등록

## 4) RAG 파이프라인 (Vector + 정적/동적 분리)

### 소스 분류
| kind | domains | 색인 정책 |
|------|---------|-----------|
| **static** | `regulation`, `precedent`, `supervisory-case`, `global-standard`, `resources` | 문서 생성·수정 시 재색인 |
| **dynamic** | `news`, `move` | 등록 시 색인 + 검색 시 최신성 가중 |

### DB 설정
1. Supabase Dashboard → **Database → Extensions** → `vector` 활성화
2. SQL Editor에서 `supabase/rag-vector.sql` 실행
3. 초기 색인:

```bash
npm run index:rag
# 또는 종류별
npm run index:rag -- --source-kind=static
npm run index:rag -- --source-kind=dynamic
```

관리자 API: `POST /api/admin/rag/reindex` `{ "source_kind": "all" }`  
상태 확인: `GET /api/admin/rag/reindex`

### 검색·답변
- `GET /api/rag/search?q=...&intent=hybrid|static|dynamic`
- `POST /api/ai-assistant`
  - 1단계: 질문 intent에 따라 static/dynamic 쿼터로 **벡터 검색**
  - 벡터 미설정·실패 시 기존 **FTS**로 자동 폴백
  - 2단계: `OPENAI_API_KEY`가 있으면 근거 기반 LLM 답변
- 임베딩 모델: `OPENAI_EMBEDDING_MODEL` (기본 `text-embedding-3-small`)

## 5) 파일 업로드 (Storage)
1. `supabase/storage.sql` 실행 (또는 Dashboard에서 `resources` public 버킷 생성)
2. `/admin/documents`에서 파일 업로드
3. `/resources` 공개 페이지에서 다운로드 링크 확인

## 6) 가입/로그인 운영 팁
- 이메일 인증 오류가 발생하면 `/login`의 `인증 메일 재전송` 버튼 사용
- 인증 완료 후 로그인하여 `/admin` 접근
- `/admin` 접근이 거부되면 `public.profiles.role='admin'` 여부 확인
