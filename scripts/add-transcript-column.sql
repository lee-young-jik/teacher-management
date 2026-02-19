-- =====================================================
-- Transcript 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- transcript 컬럼 추가 (JSONB 타입)
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT '{}'::jsonb;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.reports.transcript IS '수업 대화 전문 데이터 (AssemblyAI transcript, JSONB)';

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name = 'transcript';
