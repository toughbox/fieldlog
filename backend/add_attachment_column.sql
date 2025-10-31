-- 데이터베이스에 attachment 필드 추가
ALTER TABLE fieldlog.field_record 
ADD COLUMN IF NOT EXISTS attachment JSONB DEFAULT '[]';

-- 기존 데이터 확인
SELECT id, title, attachment FROM fieldlog.field_record 
ORDER BY created_at DESC LIMIT 5;
