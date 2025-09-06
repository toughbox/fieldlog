-- FieldLog 앱 유용한 쿼리 모음
-- 개발 및 운영에서 자주 사용되는 SQL 쿼리들

-- ===========================================
-- 1. 기본 조회 쿼리들
-- ===========================================

-- 사용자별 전체 통계 조회
SELECT 
    u.name as 사용자명,
    COUNT(fr.id) as 전체기록수,
    COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as 대기중,
    COUNT(CASE WHEN fr.status = 'in_progress' THEN 1 END) as 진행중,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as 완료,
    COUNT(CASE WHEN fr.due_date < NOW() AND fr.status != 'completed' THEN 1 END) as 지연,
    COUNT(c.id) as 카테고리수
FROM users u
LEFT JOIN field_records fr ON u.id = fr.user_id AND fr.is_deleted = false
LEFT JOIN categories c ON u.id = c.user_id AND c.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.name
ORDER BY 전체기록수 DESC;

-- 카테고리별 기록 현황
SELECT 
    c.name as 카테고리명,
    u.name as 사용자명,
    COUNT(fr.id) as 총기록수,
    COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as 대기중,
    COUNT(CASE WHEN fr.status = 'in_progress' THEN 1 END) as 진행중,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as 완료,
    ROUND(AVG(CASE WHEN fr.status = 'completed' AND fr.completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (fr.completed_at - fr.created_at))/86400 END), 1) as 평균완료일수
FROM categories c
LEFT JOIN field_records fr ON c.id = fr.category_id AND fr.is_deleted = false
LEFT JOIN users u ON c.user_id = u.id
WHERE c.is_active = true
GROUP BY c.id, c.name, u.name
ORDER BY 총기록수 DESC;

-- ===========================================
-- 2. 마감일 관련 쿼리들
-- ===========================================

-- 마감일이 임박한 작업들 (24시간 이내)
SELECT 
    fr.title as 제목,
    u.name as 담당자,
    c.name as 카테고리,
    fr.status as 상태,
    fr.priority as 우선순위,
    fr.due_date as 마감일,
    EXTRACT(HOUR FROM (fr.due_date - NOW())) as 남은시간
FROM field_records fr
JOIN users u ON fr.user_id = u.id
LEFT JOIN categories c ON fr.category_id = c.id
WHERE fr.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND fr.status != 'completed'
  AND fr.is_deleted = false
ORDER BY fr.due_date ASC;

-- 지연된 작업들
SELECT 
    fr.title as 제목,
    u.name as 담당자,
    c.name as 카테고리,
    fr.status as 상태,
    fr.priority as 우선순위,
    fr.due_date as 마감일,
    EXTRACT(DAY FROM (NOW() - fr.due_date)) as 지연일수
FROM field_records fr
JOIN users u ON fr.user_id = u.id
LEFT JOIN categories c ON fr.category_id = c.id
WHERE fr.due_date < NOW()
  AND fr.status != 'completed'
  AND fr.is_deleted = false
ORDER BY 지연일수 DESC;

-- ===========================================
-- 3. JSONB 데이터 검색 쿼리들
-- ===========================================

-- 특정 건물의 모든 하자 기록 조회
SELECT 
    fr.title,
    fr.custom_data->>'building' as 동,
    fr.custom_data->>'unit' as 호수,
    fr.custom_data->>'location' as 위치,
    fr.custom_data->>'defect_type' as 하자유형,
    fr.status,
    fr.created_at
FROM field_records fr
WHERE fr.custom_data->>'building' = '101동'
  AND fr.is_deleted = false
ORDER BY fr.created_at DESC;

-- 특정 하자 유형별 통계
SELECT 
    fr.custom_data->>'defect_type' as 하자유형,
    COUNT(*) as 발생건수,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as 완료건수,
    ROUND(COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) as 완료율
FROM field_records fr
WHERE fr.custom_data ? 'defect_type'
  AND fr.is_deleted = false
GROUP BY fr.custom_data->>'defect_type'
ORDER BY 발생건수 DESC;

-- 서버별 점검 이력 조회
SELECT 
    fr.custom_data->>'server_name' as 서버명,
    fr.custom_data->>'server_type' as 서버유형,
    fr.custom_data->>'check_type' as 점검유형,
    fr.title,
    fr.status,
    fr.created_at as 점검일시
FROM field_records fr
JOIN categories c ON fr.category_id = c.id
WHERE c.name = '서버 점검'
  AND fr.is_deleted = false
ORDER BY fr.custom_data->>'server_name', fr.created_at DESC;

-- ===========================================
-- 4. 성능 분석 쿼리들
-- ===========================================

-- 월별 기록 생성 추이
SELECT 
    DATE_TRUNC('month', fr.created_at) as 월,
    COUNT(*) as 생성건수,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as 완료건수,
    ROUND(AVG(fr.priority), 1) as 평균우선순위
FROM field_records fr
WHERE fr.created_at >= NOW() - INTERVAL '12 months'
  AND fr.is_deleted = false
GROUP BY DATE_TRUNC('month', fr.created_at)
ORDER BY 월 DESC;

-- 사용자별 작업 완료 성과
SELECT 
    u.name as 사용자명,
    COUNT(fr.id) as 총작업수,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as 완료작업수,
    ROUND(COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) * 100.0 / COUNT(fr.id), 1) as 완료율,
    ROUND(AVG(CASE WHEN fr.status = 'completed' AND fr.completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (fr.completed_at - fr.created_at))/86400 END), 1) as 평균완료일수
FROM users u
LEFT JOIN field_records fr ON u.id = fr.user_id AND fr.is_deleted = false
WHERE u.is_active = true
GROUP BY u.id, u.name
HAVING COUNT(fr.id) > 0
ORDER BY 완료율 DESC;

-- ===========================================
-- 5. 알림 관련 쿼리들
-- ===========================================

-- 알림이 필요한 작업들 (마감일 기준)
SELECT 
    fr.id,
    fr.title,
    u.name as 담당자,
    u.email,
    fr.due_date,
    ns.due_date_reminder_hours,
    (fr.due_date - INTERVAL '1 hour' * ns.due_date_reminder_hours) as 알림발송시간
FROM field_records fr
JOIN users u ON fr.user_id = u.id
JOIN notification_settings ns ON u.id = ns.user_id
WHERE fr.status NOT IN ('completed', 'cancelled')
  AND fr.due_date IS NOT NULL
  AND fr.is_deleted = false
  AND ns.push_enabled = true
  AND (fr.due_date - INTERVAL '1 hour' * ns.due_date_reminder_hours) <= NOW()
  AND NOT EXISTS (
    SELECT 1 FROM notification_logs nl 
    WHERE nl.record_id = fr.id 
    AND nl.notification_type = 'due_date'
    AND nl.sent_at >= NOW() - INTERVAL '1 day'
  )
ORDER BY fr.due_date ASC;

-- 읽지 않은 알림 조회
SELECT 
    nl.title,
    nl.message,
    nl.sent_at,
    u.name as 수신자,
    fr.title as 관련작업
FROM notification_logs nl
JOIN users u ON nl.user_id = u.id
LEFT JOIN field_records fr ON nl.record_id = fr.id
WHERE nl.is_read = false
ORDER BY nl.sent_at DESC;

-- ===========================================
-- 6. 데이터 정리 및 유지보수 쿼리들
-- ===========================================

-- 오래된 완료 작업들 (6개월 이상)
SELECT 
    COUNT(*) as 정리대상건수,
    MIN(completed_at) as 가장오래된완료일,
    MAX(completed_at) as 가장최근완료일
FROM field_records 
WHERE status = 'completed' 
  AND completed_at < NOW() - INTERVAL '6 months'
  AND is_deleted = false;

-- 첨부파일이 없는 기록들
SELECT 
    fr.id,
    fr.title,
    u.name as 사용자,
    fr.created_at
FROM field_records fr
JOIN users u ON fr.user_id = u.id
WHERE (fr.attachments IS NULL OR fr.attachments = '[]'::jsonb)
  AND fr.is_deleted = false
ORDER BY fr.created_at DESC;

-- 사용되지 않는 카테고리들
SELECT 
    c.id,
    c.name as 카테고리명,
    u.name as 소유자,
    c.created_at as 생성일
FROM categories c
JOIN users u ON c.user_id = u.id
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM field_records fr 
    WHERE fr.category_id = c.id AND fr.is_deleted = false
  )
ORDER BY c.created_at ASC;

-- ===========================================
-- 7. 백업 및 복원 관련 쿼리들
-- ===========================================

-- 특정 사용자의 모든 데이터 백업 (JSON 형태)
SELECT json_build_object(
    'user', row_to_json(u),
    'categories', (
        SELECT json_agg(row_to_json(c)) 
        FROM categories c 
        WHERE c.user_id = u.id AND c.is_active = true
    ),
    'records', (
        SELECT json_agg(row_to_json(fr)) 
        FROM field_records fr 
        WHERE fr.user_id = u.id AND fr.is_deleted = false
    ),
    'notification_settings', (
        SELECT row_to_json(ns) 
        FROM notification_settings ns 
        WHERE ns.user_id = u.id
    )
) as user_backup
FROM users u 
WHERE u.id = 1; -- 백업할 사용자 ID

-- ===========================================
-- 8. 검색 및 필터링 쿼리들
-- ===========================================

-- 전체 텍스트 검색 (제목, 설명, 커스텀 데이터)
SELECT 
    fr.id,
    fr.title,
    fr.description,
    c.name as 카테고리,
    u.name as 사용자,
    fr.status,
    fr.created_at,
    ts_rank(
        to_tsvector('korean', COALESCE(fr.title, '') || ' ' || COALESCE(fr.description, '') || ' ' || COALESCE(fr.custom_data::text, '')),
        plainto_tsquery('korean', '전기')
    ) as 관련도
FROM field_records fr
JOIN users u ON fr.user_id = u.id
LEFT JOIN categories c ON fr.category_id = c.id
WHERE to_tsvector('korean', COALESCE(fr.title, '') || ' ' || COALESCE(fr.description, '') || ' ' || COALESCE(fr.custom_data::text, ''))
      @@ plainto_tsquery('korean', '전기')
  AND fr.is_deleted = false
ORDER BY 관련도 DESC, fr.created_at DESC;

-- 태그 기반 검색
SELECT 
    fr.title,
    fr.tags,
    c.name as 카테고리,
    fr.status,
    fr.created_at
FROM field_records fr
LEFT JOIN categories c ON fr.category_id = c.id
WHERE fr.tags && ARRAY['긴급', '전기'] -- '긴급' 또는 '전기' 태그가 있는 기록
  AND fr.is_deleted = false
ORDER BY fr.created_at DESC;

-- 복합 조건 검색 (상태, 우선순위, 기간)
SELECT 
    fr.title,
    u.name as 담당자,
    c.name as 카테고리,
    fr.status,
    fr.priority,
    fr.due_date,
    fr.created_at
FROM field_records fr
JOIN users u ON fr.user_id = u.id
LEFT JOIN categories c ON fr.category_id = c.id
WHERE fr.status IN ('pending', 'in_progress')
  AND fr.priority >= 3
  AND fr.created_at >= '2024-01-01'
  AND fr.is_deleted = false
ORDER BY fr.priority DESC, fr.due_date ASC NULLS LAST;
