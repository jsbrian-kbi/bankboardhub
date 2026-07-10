# OpenAI 연동 가이드 (AI Board Assistant)

AI Assistant는 기본적으로 **Supabase 검색 기반 답변**을 제공합니다.  
`OPENAI_API_KEY`를 설정하면 **근거 기반 LLM 답변**으로 전환됩니다.

## 1) OpenAI API Key 발급

1. https://platform.openai.com 접속
2. **API keys** → **Create new secret key**
3. 생성된 키 복사 (한 번만 표시됨)

## 2) Vercel 환경변수 설정

Vercel → Project → **Settings** → **Environment Variables**

| Key | Value | Environment |
|-----|-------|-------------|
| `OPENAI_API_KEY` | `sk-...` | Production, Preview, Development |
| `OPENAI_MODEL` | `gpt-4o-mini` | Production, Preview, Development |

저장 후 **Deployments** → **Redeploy**

## 3) 로컬 테스트

`.env.local`에 추가:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

```bash
npm run restart
```

## 4) 동작 확인

1. https://bankboardhub.vercel.app/ai-assistant 접속
2. 예시 질문 클릭 또는 직접 입력
3. 답변 배지 확인:
   - **AI 생성** → OpenAI 연동 성공
   - **검색 기반** → API 키 미설정 또는 검색만 사용

Health API 확인:

```
GET https://bankboardhub.vercel.app/api/health
→ "openai": "configured"
```

## 5) 비용·운영 팁

- `gpt-4o-mini`는 비용 대비 속도가 좋은 기본 모델입니다.
- 검색 결과(`search_documents`)가 없으면 LLM도 근거 부족 메시지를 반환합니다.
- 운영 전 `supabase/seed-sample.sql` 또는 관리자 CRUD로 문서를 충분히 등록하세요.

## 6) 문제 해결

| 증상 | 해결 |
|------|------|
| 항상 "검색 기반" | Vercel env 확인 후 Redeploy |
| LLM 오류 메시지 | API 키 유효성, OpenAI 크레딧 확인 |
| 답변 근거 부족 | regulation/precedent 등 문서 추가 등록 |
