-- 샘플 데이터 (Supabase SQL Editor에서 선택 실행)
-- 이미 있는 데이터와 title이 겹치면 중복 삽입될 수 있으니 필요 시 선별 실행하세요.

insert into public.documents (domain, title, body, source_name, published_at, is_public) values
('news', '금융위, 지배구조 가이드라인 개정 추진', '금융회사 지배구조 관련 공시 의무가 강화될 예정입니다.', '금융위원회', '2026-07-01', true),
('regulation', '금융회사지배구조법 제16조 (이사회 구성)', '은행의 이사회는 사외이사를 포함하여 구성하여야 한다.', '금융회사지배구조법', '2024-01-01', true),
('precedent', '사외이사 주의의무 위반 관련 주요 쟁점', '사외이사의 주의의무 범위와 내부통제 관련 책임이 쟁점이 되었습니다.', '대법원', '2025-03-12', true),
('supervisory-case', '내부통제 미흡에 대한 검사 지적 사례', '이사회 보고체계 및 리스크 모니터링 절차 미비가 지적되었습니다.', '금융감독원', '2025-11-20', true),
('move', '○○은행 사외이사 신규 선임', '전문가 출신 사외이사 1인이 신규 선임되었습니다.', 'KB금융', '2026-06-15', true),
('global-standard', 'OECD Corporate Governance Principles', '이사회의 독립성·책임성·투명성 강화를 핵심 원칙으로 제시합니다.', 'OECD', null, true),
('resources', '이사회 운영 모범규준 요약본', '이사회 의장·사외이사 역할, 위원회 운영, 정보 제공 체계를 정리한 자료입니다.', '내부통제위원회', '2026-01-10', true);

insert into public.banks (name, board_size, outside_director_count, female_ratio, term_status) values
('KB금융', 11, 6, 27.30, '정기'),
('신한금융지주', 10, 5, 30.00, '정기'),
('하나금융지주', 9, 5, 22.20, '정기')
on conflict (name) do nothing;

insert into public.education_programs (title, track, starts_at, capacity, description) values
('사외이사 핵심교육 2026', '사외이사 교육', '2026-09-01 09:00:00+09', 30, '지배구조·내부통제·리스크관리 통합 과정'),
('감사위원회 실무 워크숍', '위원회 교육', '2026-10-15 14:00:00+09', 20, '감사위원회 운영 및 내부통제 점검 실무');
