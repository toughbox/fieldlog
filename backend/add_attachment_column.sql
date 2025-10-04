-- 데이터베이스에 attachment 필드 추가
ALTER TABLE fieldlog.field_record 
ADD COLUMN IF NOT EXISTS attachment JSONB DEFAULT '[]';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_field_record_attachment 
ON fieldlog.field_record USING GIN (attachment);

-- 기존 데이터 확인
SELECT id, title, attachment FROM fieldlog.field_record 
ORDER BY created_at DESC LIMIT 5;
