-- FieldLog 앱 샘플 데이터
-- 테스트 및 개발용 초기 데이터

-- 샘플 사용자 생성
-- 비밀번호는 모두 'password123' (실제로는 해시된 값 사용)
INSERT INTO fieldlog.user (email, password_hash, name, phone) VALUES 
('admin@fieldlog.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Uo6HqLOX9QV83jcxzc8qMCloMFUxHS', '관리자', '010-1234-5678'),
('manager@construction.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Uo6HqLOX9QV83jcxzc8qMCloMFUxHS', '현장관리자', '010-2345-6789'),
('worker@field.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.Uo6HqLOX9QV83jcxzc8qMCloMFUxHS', '현장작업자', '010-3456-7890');

-- 샘플 현장 생성
INSERT INTO fieldlog.field (user_id, name, description, color, icon, field_schema, sort_order) VALUES 
-- 건설현장 하자관리
(2, '건설현장 하자관리', '아파트 건설현장 하자 관리용', '#FF6B6B', 'construction', 
 '{"fields": [
    {"key": "building", "label": "동", "type": "text", "required": true, "placeholder": "예: 101동"},
    {"key": "unit", "label": "호수", "type": "text", "required": true, "placeholder": "예: 2001호"},
    {"key": "location", "label": "위치", "type": "select", "required": true, "options": ["거실", "주방", "화장실", "침실1", "침실2", "베란다", "현관", "발코니"]},
    {"key": "defect_type", "label": "하자유형", "type": "select", "required": true, "options": ["전기", "배관", "도배", "바닥", "창호", "타일", "도어", "기타"]},
    {"key": "severity", "label": "심각도", "type": "select", "required": true, "options": ["낮음", "보통", "높음", "긴급"]},
    {"key": "assigned_team", "label": "이관팀", "type": "select", "required": false, "options": ["전기팀", "배관팀", "도배팀", "바닥팀", "창호팀", "타일팀"]},
    {"key": "estimated_cost", "label": "예상비용", "type": "number", "required": false, "placeholder": "원"}
  ]}'::jsonb, 1),

-- 서버 관리
(2, '서버 점검', 'IT 인프라 서버 점검 및 관리', '#3B82F6', 'server', 
 '{"fields": [
    {"key": "server_name", "label": "서버명", "type": "text", "required": true, "placeholder": "예: WEB-01"},
    {"key": "server_type", "label": "서버유형", "type": "select", "required": true, "options": ["웹서버", "DB서버", "파일서버", "메일서버", "백업서버"]},
    {"key": "ip_address", "label": "IP주소", "type": "text", "required": false, "placeholder": "예: 192.168.1.100"},
    {"key": "check_type", "label": "점검유형", "type": "select", "required": true, "options": ["정기점검", "장애대응", "성능점검", "보안점검", "업데이트"]},
    {"key": "downtime_required", "label": "다운타임필요", "type": "select", "required": true, "options": ["예", "아니오"]},
    {"key": "backup_completed", "label": "백업완료", "type": "select", "required": false, "options": ["완료", "미완료", "해당없음"]}
  ]}'::jsonb, 2),

-- 배송 관리
(3, '배송 관리', '택배 및 물류 배송 관리', '#10B981', 'truck', 
 '{"fields": [
    {"key": "tracking_number", "label": "송장번호", "type": "text", "required": true, "placeholder": "예: 1234567890"},
    {"key": "delivery_type", "label": "배송유형", "type": "select", "required": true, "options": ["일반배송", "당일배송", "새벽배송", "픽업"]},
    {"key": "recipient_name", "label": "수령인", "type": "text", "required": true, "placeholder": "홍길동"},
    {"key": "recipient_phone", "label": "연락처", "type": "text", "required": true, "placeholder": "010-0000-0000"},
    {"key": "delivery_address", "label": "배송주소", "type": "text", "required": true, "placeholder": "서울시 강남구..."},
    {"key": "package_type", "label": "상품유형", "type": "select", "required": false, "options": ["일반", "냉장", "냉동", "깨지기쉬움", "위험물"]},
    {"key": "delivery_fee", "label": "배송비", "type": "number", "required": false, "placeholder": "원"}
  ]}'::jsonb, 3),

-- 행사 관리
(1, '행사 준비', '이벤트 및 행사 준비 관리', '#8B5CF6', 'calendar', 
 '{"fields": [
    {"key": "event_name", "label": "행사명", "type": "text", "required": true, "placeholder": "예: 신제품 발표회"},
    {"key": "event_type", "label": "행사유형", "type": "select", "required": true, "options": ["컨퍼런스", "세미나", "워크샵", "전시회", "파티", "기타"]},
    {"key": "venue", "label": "장소", "type": "text", "required": true, "placeholder": "예: 코엑스 컨벤션센터"},
    {"key": "expected_attendees", "label": "예상참석자", "type": "number", "required": false, "placeholder": "명"},
    {"key": "budget", "label": "예산", "type": "number", "required": false, "placeholder": "원"},
    {"key": "vendor", "label": "협력업체", "type": "text", "required": false, "placeholder": "업체명"},
    {"key": "equipment_needed", "label": "필요장비", "type": "text", "required": false, "placeholder": "마이크, 프로젝터 등"}
  ]}'::jsonb, 4);

-- 샘플 현장 기록 생성
INSERT INTO fieldlog.field_record (user_id, field_id, title, description, status, priority, due_date, custom_data, tags) VALUES 
-- 건설현장 하자 기록들
(2, 1, '101동 2001호 전기 하자', '거실 콘센트 3개 중 2개 작동 불가. 전기 입선 불량으로 추정됨.', 'pending', 4, '2024-01-20 09:00:00', 
 '{"building": "101동", "unit": "2001호", "location": "거실", "defect_type": "전기", "severity": "높음", "assigned_team": "전기팀", "estimated_cost": 150000}'::jsonb, 
 ARRAY['전기', '긴급', '101동']),

(2, 1, '102동 1505호 배관 누수', '화장실 세면대 하부 급수관에서 물이 새고 있음. 즉시 수리 필요.', 'in_progress', 5, '2024-01-18 14:00:00', 
 '{"building": "102동", "unit": "1505호", "location": "화장실", "defect_type": "배관", "severity": "긴급", "assigned_team": "배관팀", "estimated_cost": 80000}'::jsonb, 
 ARRAY['배관', '누수', '긴급']),

(2, 1, '101동 1203호 도배 불량', '침실1 벽지 모서리 부분이 들뜨고 있음. 재시공 필요.', 'completed', 2, '2024-01-15 16:00:00', 
 '{"building": "101동", "unit": "1203호", "location": "침실1", "defect_type": "도배", "severity": "보통", "assigned_team": "도배팀", "estimated_cost": 120000}'::jsonb, 
 ARRAY['도배', '완료']),

-- 서버 점검 기록들
(2, 2, 'WEB-01 서버 정기점검', '웹서버 월간 정기점검 및 성능 모니터링', 'pending', 3, '2024-01-25 02:00:00', 
 '{"server_name": "WEB-01", "server_type": "웹서버", "ip_address": "192.168.1.10", "check_type": "정기점검", "downtime_required": "예", "backup_completed": "완료"}'::jsonb, 
 ARRAY['정기점검', '웹서버']),

(2, 2, 'DB-01 백업 실패 대응', '데이터베이스 자동 백업이 3일 연속 실패. 원인 파악 및 복구 필요.', 'in_progress', 5, '2024-01-17 10:00:00', 
 '{"server_name": "DB-01", "server_type": "DB서버", "ip_address": "192.168.1.20", "check_type": "장애대응", "downtime_required": "아니오", "backup_completed": "미완료"}'::jsonb, 
 ARRAY['백업', '장애', '긴급']),

-- 배송 관리 기록들
(3, 3, '긴급 배송 - 의료용품', '병원 응급실 의료용품 긴급 배송. 당일 배송 필수.', 'in_progress', 5, '2024-01-16 18:00:00', 
 '{"tracking_number": "1234567890", "delivery_type": "당일배송", "recipient_name": "서울대병원", "recipient_phone": "02-2072-2114", "delivery_address": "서울시 종로구 대학로 101", "package_type": "일반", "delivery_fee": 15000}'::jsonb, 
 ARRAY['긴급', '의료', '당일배송']),

(3, 3, '냉동식품 배송 지연', '냉동 배송 차량 고장으로 배송 지연. 대체 차량 투입 필요.', 'pending', 4, '2024-01-17 12:00:00', 
 '{"tracking_number": "9876543210", "delivery_type": "새벽배송", "recipient_name": "김철수", "recipient_phone": "010-1234-5678", "delivery_address": "경기도 성남시 분당구 정자동", "package_type": "냉동", "delivery_fee": 8000}'::jsonb, 
 ARRAY['냉동', '지연', '차량고장']),

-- 행사 준비 기록들
(1, 4, '신제품 발표회 장소 예약', '코엑스 컨벤션센터 대회의실 예약 및 계약서 작성', 'completed', 3, '2024-01-10 17:00:00', 
 '{"event_name": "신제품 발표회", "event_type": "컨퍼런스", "venue": "코엑스 컨벤션센터", "expected_attendees": 200, "budget": 5000000, "vendor": "코엑스", "equipment_needed": "프로젝터, 음향시설, 무선마이크"}'::jsonb, 
 ARRAY['발표회', '예약완료']),

(1, 4, '케이터링 업체 선정', '행사용 케이터링 업체 3곳 견적 비교 후 최종 선정', 'pending', 2, '2024-01-22 15:00:00', 
 '{"event_name": "신제품 발표회", "event_type": "컨퍼런스", "venue": "코엑스 컨벤션센터", "expected_attendees": 200, "budget": 1500000, "vendor": "미정", "equipment_needed": "해당없음"}'::jsonb, 
 ARRAY['케이터링', '견적비교']);

-- 완료된 기록의 completed_at 업데이트
UPDATE fieldlog.field_record SET completed_at = '2024-01-15 17:30:00' WHERE id = 3;
UPDATE fieldlog.field_record SET completed_at = '2024-01-10 18:00:00' WHERE id = 8;

-- 샘플 알림 설정
INSERT INTO fieldlog.notification_setting (user_id, due_date_reminder_hours, push_enabled, email_enabled) VALUES 
(1, 24, true, true),
(2, 12, true, false),
(3, 48, true, true);

-- 샘플 알림 로그
INSERT INTO fieldlog.notification_log (user_id, record_id, notification_type, channel, title, message, sent_at, is_read) VALUES 
(2, 2, 'due_date', 'push', '마감 임박 알림', '102동 1505호 배관 누수 작업이 2시간 후 마감됩니다.', '2024-01-18 12:00:00', true),
(3, 6, 'status_change', 'push', '상태 변경 알림', '긴급 배송 - 의료용품이 진행중으로 변경되었습니다.', '2024-01-16 14:30:00', false),
(1, 8, 'status_change', 'email', '작업 완료 알림', '신제품 발표회 장소 예약이 완료되었습니다.', '2024-01-10 18:00:00', true);

-- 샘플 활동 로그
INSERT INTO fieldlog.activity_log (user_id, record_id, action, entity_type, entity_id, new_data, ip_address, user_agent) VALUES 
(2, 1, 'create', 'record', 1, '{"title": "101동 2001호 전기 하자", "status": "pending"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'),
(2, 2, 'update', 'record', 2, '{"status": "in_progress"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'),
(2, 3, 'complete', 'record', 3, '{"status": "completed", "completed_at": "2024-01-15T17:30:00Z"}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)');

-- 통계 확인 쿼리 (참고용)
-- SELECT * FROM fieldlog.user_statistics;
-- SELECT * FROM fieldlog.field_statistics;

-- 데이터 검증 쿼리들
-- SELECT u.name, COUNT(fr.id) as record_count 
-- FROM fieldlog.user u 
-- LEFT JOIN fieldlog.field_record fr ON u.id = fr.user_id 
-- GROUP BY u.id, u.name;

-- SELECT f.name, COUNT(fr.id) as record_count, 
--        COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as pending,
--        COUNT(CASE WHEN fr.status = 'in_progress' THEN 1 END) as in_progress,
--        COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as completed
-- FROM fieldlog.field f 
-- LEFT JOIN fieldlog.field_record fr ON f.id = fr.field_id 
-- GROUP BY f.id, f.name;
