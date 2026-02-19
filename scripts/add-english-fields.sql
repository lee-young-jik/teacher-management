-- =====================================================
-- 영어 필드 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 영어 버전 필드 추가
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS strengths_en JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS improvements_en JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS highlights_en JSONB DEFAULT '[]'::jsonb;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.reports.strengths_en IS '우수점 배열 (영어 버전, JSONB)';
COMMENT ON COLUMN public.reports.improvements_en IS '개선점 배열 (영어 버전, JSONB)';
COMMENT ON COLUMN public.reports.highlights_en IS '수업 하이라이트 배열 (영어 버전, JSONB)';

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name LIKE '%_en'
ORDER BY ordinal_position;
