# Go-Live 체크리스트

프로덕션 URL: **https://bankboardhub.vercel.app**

## 완료 항목

- [x] GitHub 저장소: https://github.com/jsbrian-kbi/bankboardhub
- [x] Vercel 배포 및 환경변수 (Supabase 3키)
- [x] 프로덕션 Health Check (`supabase: configured`, `openai: configured`)
- [x] 공개 페이지 동작 (`/`, `/news`, `/search`)
- [x] 관리자 로그인·권한 로직 (로컬 검증 완료)
- [x] OpenAI 연동 (`OPENAI_API_KEY`, `npm run verify:openai`)
- [x] 샘플 데이터 (`npm run seed:sample`)
- [x] 관리자 메뉴별 문서·웹사이트 업로드
- [x] AI Assistant 검색/LLM 동작 확인
- [x] sitemap/robots 프로덕션 도메인 반영 (`bankboardhub.vercel.app`)
- [x] pgvector RAG (`rag-vector.sql` + `npm run index:rag`) — `retrievalMode: vector`

## 배포 직후 확인 (권장)

- [ ] Supabase Auth URL 설정 (`docs/supabase-production-auth.md`)
  - Dashboard: https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc/auth/url-configuration
- [ ] Vercel `NEXT_PUBLIC_SITE_URL=https://bankboardhub.vercel.app` + Redeploy (SEO 권장)
- [ ] 프로덕션 `/login` → `/admin` 로그인 테스트
- [ ] `/admin/news` 콘텐츠 등록 → `/news` 반영 확인
- [ ] `/admin/documents` 파일 업로드 → `/resources` 링크 확인
- [ ] `/api/rag/search?q=사외이사` 응답에 `"mode":"vector"` 확인

## 선택 항목

- [ ] 커스텀 도메인 연결 → [커스텀 도메인 가이드](custom-domain.md)
- [ ] Supabase `fix-rls-recursion.sql` 미적용 시 실행
- [ ] Google Search Console 등록
- [ ] Vercel에 `OPENAI_EMBEDDING_MODEL=text-embedding-3-small` 명시 (미설정 시 기본값 사용)

## 검증 명령

```bash
# 로컬 배포 사전 점검
npm run deploy:preflight

# 프로덕션 스모크 테스트
npm run verify:production -- https://bankboardhub.vercel.app

# OpenAI 연동 확인
npm run verify:openai

# Auth URL 설정 안내 + callback 스모크
npm run verify:auth-urls -- https://bankboardhub.vercel.app
```

## 운영 URL

| 용도 | URL |
|------|-----|
| 공개 사이트 | https://bankboardhub.vercel.app |
| 로그인 | https://bankboardhub.vercel.app/login |
| 관리자 | https://bankboardhub.vercel.app/admin |
| AI Assistant | https://bankboardhub.vercel.app/ai-assistant |
| Health | https://bankboardhub.vercel.app/api/health |
| GitHub | https://github.com/jsbrian-kbi/bankboardhub |
| Supabase | https://supabase.com/dashboard/project/jqihncwypxkxtmlipgtc |

## 장애 대응

| 증상 | 조치 |
|------|------|
| 로그인 실패 | Supabase Redirect URL, 이메일 인증 확인 |
| /admin 403 | `promote-admin.sql` 재실행 |
| 검색 빈 결과 | 관리자에서 콘텐츠 등록 또는 `seed-sample.sql` |
| AI가 FTS만 사용 | `rag-vector.sql` 적용 여부 + `npm run index:rag` + OpenAI 키 확인 |
| 빌드 실패 | Vercel 환경변수 3키 재확인 후 Redeploy |
| sitemap 잘못된 도메인 | `NEXT_PUBLIC_SITE_URL` 설정 후 Redeploy (또는 최신 배포 확인) |
