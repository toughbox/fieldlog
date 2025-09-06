-- FieldLog 앱 데이터베이스 스키마
-- PostgreSQL 15+ 버전 호환
-- 작성일: 2024년 1월

-- 데이터베이스 생성 (필요시)
-- CREATE DATABASE fieldlog;
-- \c fieldlog;

-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS fieldlog;

-- UUID 확장 활성화 (UUID 사용시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE fieldlog.user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 테이블 인덱스
CREATE INDEX idx_user_email ON fieldlog.user (email);
CREATE INDEX idx_user_active ON fieldlog.user (is_active);

-- 카테고리 테이블
CREATE TABLE fieldlog.category (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366F1', -- HEX 색상코드
    icon VARCHAR(50) DEFAULT 'folder', -- 아이콘 이름
    field_schema JSONB NOT NULL DEFAULT '{"fields": []}', -- 사용자 정의 속성 스키마
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT category_user_name_unique UNIQUE (user_id, name)
);

-- 카테고리 테이블 인덱스
CREATE INDEX idx_category_user_id ON fieldlog.category (user_id);
CREATE INDEX idx_category_field_schema ON fieldlog.category USING GIN (field_schema);
CREATE INDEX idx_category_active ON fieldlog.category (is_active);

-- 현장 기록 테이블 (메인)
CREATE TABLE fieldlog.field_record (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES fieldlog.category(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1(낮음) ~ 5(높음)
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    custom_data JSONB DEFAULT '{}', -- 사용자 정의 속성 데이터
    attachment JSONB DEFAULT '[]', -- 첨부파일 정보
    location JSONB, -- GPS 좌표 등 위치 정보
    tags TEXT[], -- 태그 배열
    is_deleted BOOLEAN DEFAULT false, -- 소프트 삭제
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 현장 기록 테이블 인덱스
CREATE INDEX idx_field_record_user_id ON fieldlog.field_record (user_id);
CREATE INDEX idx_field_record_category_id ON fieldlog.field_record (category_id);
CREATE INDEX idx_field_record_status ON fieldlog.field_record (status);
CREATE INDEX idx_field_record_priority ON fieldlog.field_record (priority);
CREATE INDEX idx_field_record_due_date ON fieldlog.field_record (due_date);
CREATE INDEX idx_field_record_created_at ON fieldlog.field_record (created_at);
CREATE INDEX idx_field_record_custom_data ON field_record USING GIN (custom_data);
CREATE INDEX idx_field_record_tags ON field_record USING GIN (tags);
CREATE INDEX idx_field_record_user_category ON fieldlog.field_record (user_id, category_id);
CREATE INDEX idx_field_record_user_status ON fieldlog.field_record (user_id, status);
CREATE INDEX idx_field_record_deleted ON fieldlog.field_record (is_deleted);

-- 첨부파일 테이블 (별도 관리 필요시)
CREATE TABLE fieldlog.attachment (
    id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES fieldlog.field_record(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64), -- 파일 무결성 검증용
    created_at TIMESTAMP DEFAULT NOW()
);

-- 첨부파일 테이블 인덱스
CREATE INDEX idx_attachment_record_id ON fieldlog.attachment (record_id);
CREATE INDEX idx_attachment_mime_type ON fieldlog.attachment (mime_type);

-- 알림 설정 테이블
CREATE TABLE fieldlog.notification_setting (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    due_date_reminder_hours INTEGER DEFAULT 24 CHECK (due_date_reminder_hours >= 0), -- 마감일 몇 시간 전 알림
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    sms_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00:00', -- 알림 금지 시간 시작
    quiet_hours_end TIME DEFAULT '08:00:00', -- 알림 금지 시간 종료
    weekend_notifications BOOLEAN DEFAULT true, -- 주말 알림 허용
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 사용자당 하나의 설정만 허용
    CONSTRAINT notification_setting_user_unique UNIQUE (user_id)
);

-- 알림 로그 테이블 (발송된 알림 추적)
CREATE TABLE fieldlog.notification_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES fieldlog.field_record(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- due_date, status_change, reminder
    channel VARCHAR(20) NOT NULL, -- push, email, sms
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP
);

-- 알림 로그 인덱스
CREATE INDEX idx_notification_log_user_id ON fieldlog.notification_log (user_id);
CREATE INDEX idx_notification_log_record_id ON fieldlog.notification_log (record_id);
CREATE INDEX idx_notification_log_sent_at ON fieldlog.notification_log (sent_at);
CREATE INDEX idx_notification_log_is_read ON fieldlog.notification_log (is_read);

-- 사용자 활동 로그 테이블 (선택사항)
CREATE TABLE fieldlog.activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    record_id INTEGER REFERENCES fieldlog.field_record(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, complete, etc.
    entity_type VARCHAR(50) NOT NULL, -- record, category, user
    entity_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 활동 로그 인덱스
CREATE INDEX idx_activity_log_user_id ON fieldlog.activity_log (user_id);
CREATE INDEX idx_activity_log_record_id ON fieldlog.activity_log (record_id);
CREATE INDEX idx_activity_log_action ON fieldlog.activity_log (action);
CREATE INDEX idx_activity_log_created_at ON fieldlog.activity_log (created_at);

-- 사용자 세션 테이블 (JWT 토큰 관리)
CREATE TABLE fieldlog.user_session (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

-- 세션 테이블 인덱스
CREATE INDEX idx_user_session_user_id ON fieldlog.user_session (user_id);
CREATE INDEX idx_user_session_refresh_token ON fieldlog.user_session (refresh_token);
CREATE INDEX idx_user_session_expires_at ON fieldlog.user_session (expires_at);
CREATE INDEX idx_user_session_active ON fieldlog.user_session (is_active);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON fieldlog.user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON fieldlog.category
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_record_updated_at BEFORE UPDATE ON fieldlog.field_record
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_setting_updated_at BEFORE UPDATE ON fieldlog.notification_setting
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰: 사용자별 통계
CREATE VIEW fieldlog.user_statistics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(fr.id) as total_records,
    COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as pending_records,
    COUNT(CASE WHEN fr.status = 'in_progress' THEN 1 END) as in_progress_records,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as completed_records,
    COUNT(CASE WHEN fr.due_date < NOW() AND fr.status != 'completed' THEN 1 END) as overdue_records,
    COUNT(CASE WHEN fr.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours' AND fr.status != 'completed' THEN 1 END) as due_soon_records,
    COUNT(c.id) as total_categories
FROM fieldlog.user u
LEFT JOIN fieldlog.field_record fr ON u.id = fr.user_id AND fr.is_deleted = false
LEFT JOIN fieldlog.category c ON u.id = c.user_id AND c.is_active = true
WHERE u.is_active = true
GROUP BY u.id, u.name;

-- 뷰: 카테고리별 통계
CREATE VIEW fieldlog.category_statistics AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.user_id,
    COUNT(fr.id) as total_records,
    COUNT(CASE WHEN fr.status = 'pending' THEN 1 END) as pending_records,
    COUNT(CASE WHEN fr.status = 'in_progress' THEN 1 END) as in_progress_records,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as completed_records,
    AVG(CASE WHEN fr.status = 'completed' AND fr.completed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (fr.completed_at - fr.created_at))/86400 END) as avg_completion_days
FROM fieldlog.category c
LEFT JOIN fieldlog.field_record fr ON c.id = fr.category_id AND fr.is_deleted = false
WHERE c.is_active = true
GROUP BY c.id, c.name, c.user_id;

-- 기본 데이터 삽입 (선택사항)
-- 관리자 계정 생성 예시
-- INSERT INTO fieldlog.user (email, password_hash, name) VALUES 
-- ('admin@fieldlog.com', '$2b$10$example_hash', '관리자');

-- 샘플 카테고리 스키마
-- INSERT INTO fieldlog.category (user_id, name, description, color, icon, field_schema) VALUES 
-- (1, '건설현장 하자관리', '아파트 건설현장 하자 관리용', '#FF6B6B', 'construction', 
--  '{"fields": [
--     {"key": "building", "label": "동", "type": "text", "required": true, "placeholder": "예: 101동"},
--     {"key": "unit", "label": "호수", "type": "text", "required": true, "placeholder": "예: 2001호"},
--     {"key": "location", "label": "위치", "type": "select", "required": true, "options": ["거실", "주방", "화장실", "침실1", "침실2", "베란다"]},
--     {"key": "defect_type", "label": "하자유형", "type": "select", "required": true, "options": ["전기", "배관", "도배", "바닥", "창호", "기타"]},
--     {"key": "assigned_team", "label": "이관", "type": "select", "required": false, "options": ["전기팀", "배관팀", "도배팀", "바닥팀", "창호팀"]}
--   ]}'::jsonb);

-- 성능 최적화를 위한 추가 설정
-- JSONB 컬럼에 대한 통계 수집 활성화
ALTER TABLE fieldlog.field_record ALTER COLUMN custom_data SET STATISTICS 1000;
ALTER TABLE fieldlog.category ALTER COLUMN field_schema SET STATISTICS 1000;

-- 자동 VACUUM 설정 (선택사항)
-- ALTER TABLE fieldlog.field_record SET (autovacuum_vacuum_scale_factor = 0.1);
-- ALTER TABLE fieldlog.activity_log SET (autovacuum_vacuum_scale_factor = 0.05);

-- 파티셔닝 예시 (대용량 데이터 처리시)
-- CREATE TABLE fieldlog.field_record_2024 PARTITION OF fieldlog.field_record
-- FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

COMMENT ON DATABASE fieldlog IS '현장기록(FieldLog) 앱 데이터베이스';
COMMENT ON TABLE fieldlog.user IS '사용자 정보';
COMMENT ON TABLE fieldlog.category IS '사용자 정의 카테고리';
COMMENT ON TABLE fieldlog.field_record IS '현장 기록 메인 테이블';
COMMENT ON TABLE fieldlog.attachment IS '첨부파일 정보';
COMMENT ON TABLE fieldlog.notification_setting IS '사용자별 알림 설정';
COMMENT ON TABLE fieldlog.notification_log IS '발송된 알림 로그';
COMMENT ON TABLE fieldlog.activity_log IS '사용자 활동 로그';
COMMENT ON TABLE fieldlog.user_session IS '사용자 세션 관리';

COMMENT ON COLUMN fieldlog.field_record.custom_data IS '사용자 정의 속성 데이터 (JSONB)';
COMMENT ON COLUMN fieldlog.category.field_schema IS '카테고리별 필드 스키마 정의 (JSONB)';
COMMENT ON COLUMN fieldlog.field_record.status IS 'pending, in_progress, completed, cancelled';
COMMENT ON COLUMN fieldlog.field_record.priority IS '1(낮음) ~ 5(높음)';
