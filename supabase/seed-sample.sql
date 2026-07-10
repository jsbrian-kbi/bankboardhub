-- 샘플 데이터 (Supabase SQL Editor에서 선택 실행)

insert into public.documents (domain, title, body, source_name, published_at, is_public) values
('news', '금융위, 지배구조 가이드라인 개정 추진', '금융회사 지배구조 관련 공시 의무가 강화될 예정입니다.', '금융위원회', '2026-07-01', true),
('regulation', '금융회사지배구조법 제16조 (이사회 구성)', '은행의 이사회는 사외이사를 포함하여 구성하여야 한다.', '금융회사지배구조법', '2024-01-01', true),
('move', '○○은행 사외이사 신규 선임', '전문가 출신 사외이사 1인이 신규 선임되었습니다.', 'KB금융', '2026-06-15', true),
('global-standard', 'OECD Corporate Governance Principles', '이사회의 독립성·책임성·투명성 강화를 핵심 원칙으로 제시합니다.', 'OECD', null, true);

insert into public.banks (name, board_size, outside_director_count, female_ratio, term_status) values
('KB금융', 11, 6, 27.30, '정기')
on conflict (name) do nothing;

insert into public.education_programs (title, track, starts_at, capacity, description) values
('사외이사 핵심교육 2026', '사외이사 교육', '2026-09-01 09:00:00+09', 30, '지배구조·내부통제·리스크관리 통합 과정');
