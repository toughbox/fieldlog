-- Push 토큰 테이블 추가
-- FCM 디바이스 토큰 저장용

CREATE TABLE IF NOT EXISTS fieldlog.push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES fieldlog."user"(id) ON DELETE CASCADE,
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- 'ios' 또는 'android'
    device_info JSONB DEFAULT '{}', -- 디바이스 정보 (모델명, OS 버전 등)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    
    -- 같은 디바이스는 하나의 토큰만 가질 수 있도록
    CONSTRAINT unique_device_token UNIQUE (device_token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON fieldlog.push_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_device_token ON fieldlog.push_tokens (device_token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON fieldlog.push_tokens (is_active);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_tokens_updated_at 
    BEFORE UPDATE ON fieldlog.push_tokens
    FOR EACH ROW 
    EXECUTE FUNCTION update_push_tokens_updated_at();

COMMENT ON TABLE fieldlog.push_tokens IS 'FCM 푸시 알림 디바이스 토큰';
COMMENT ON COLUMN fieldlog.push_tokens.device_token IS 'FCM 디바이스 토큰';
COMMENT ON COLUMN fieldlog.push_tokens.device_type IS '디바이스 타입 (ios/android)';
COMMENT ON COLUMN fieldlog.push_tokens.is_active IS '활성 상태';

