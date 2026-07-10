# Information Architecture / Sitemap / User Flow

## IA
- Public Layer
  - 이사회, 사외이사, 위원회, 법규·정책센터, 감독·검사사례, 판례 라이브러리, 국제기준, 은행 이사회 현황, 사외이사 인사동정, 뉴스센터, 교육센터, 자료실, AI Board Assistant
- Admin Layer
  - 뉴스 등록, 판례 등록, 검사사례 등록, 교육 등록, 은행정보 수정, 문서 업로드, 사용자 관리, 게시판 관리

## Sitemap
- `/`
- `/board`
- `/outside-director`
- `/committees`
- `/committees/[slug]`
- `/regulation`
- `/supervisory-cases`
- `/precedents`
- `/global-standards`
- `/bank-status`
- `/moves`
- `/news`
- `/education`
- `/resources`
- `/ai-assistant`
- `/admin`
- `/admin/*`

## User Flow
1. 일반 사용자
   - 홈 진입 → 메뉴 선택 → 상세 읽기 → 검색 → 관련 문서 저장/재탐색
2. 관리자
   - 관리자 로그인 → 콘텐츠 등록/수정 → 검수 → 게시
3. 사외이사
   - 이슈 확인 → 위원회 페이지 점검 → 체크리스트 출력 → 회의 준비
