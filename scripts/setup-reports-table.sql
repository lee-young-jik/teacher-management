-- =====================================================
-- Reports 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. reports 테이블 생성
CREATE TABLE IF NOT EXISTS public.reports (
    id BIGSERIAL PRIMARY KEY,
    report_id TEXT UNIQUE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_name TEXT NOT NULL,
    title TEXT,
    filename TEXT,
    file_size BIGINT,
    video_duration TEXT,
    
    -- 평가 점수 (5개 영역, 각 0-20점)
    score_student_participation INT DEFAULT 0,  -- 학생 참여도
    score_concept_explanation INT DEFAULT 0,    -- 개념 설명
    score_feedback INT DEFAULT 0,               -- 피드백
    score_structure INT DEFAULT 0,              -- 수업 체계성
    score_interaction INT DEFAULT 0,            -- 상호작용
    total_score INT DEFAULT 0,                  -- 총점 (5개 합계)
    
    -- 상세 분석 결과 (JSON)
    strengths JSONB DEFAULT '[]'::jsonb,        -- 우수점 배열
    improvements JSONB DEFAULT '[]'::jsonb,     -- 개선점 배열
    highlights JSONB DEFAULT '[]'::jsonb,       -- 하이라이트 배열
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reports_teacher_id ON public.reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reports_teacher_name ON public.reports(teacher_name);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_report_id ON public.reports(report_id);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_reports_updated_at();

-- 4. Row Level Security (RLS) 활성화
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 설정

-- 기존 정책 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Teachers can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Admin can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Service role full access" ON public.reports;
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;

-- 선생님은 본인 보고서만 조회 가능
CREATE POLICY "Teachers can view own reports"
    ON public.reports
    FOR SELECT
    TO authenticated
    USING (
        teacher_id = auth.uid() OR
        teacher_name = (SELECT full_name FROM public.profiles WHERE id = auth.uid())
    );

-- admin 역할은 모든 보고서 조회 가능
CREATE POLICY "Admin can view all reports"
    ON public.reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 서비스 역할은 모든 권한
CREATE POLICY "Service role full access"
    ON public.reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 인증된 사용자는 보고서 삽입 가능 (분석 결과 저장용)
CREATE POLICY "Authenticated can insert reports"
    ON public.reports
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. 테이블 코멘트
COMMENT ON TABLE public.reports IS '선생님 수업 분석 보고서 테이블';
COMMENT ON COLUMN public.reports.report_id IS '보고서 고유 ID (타임스탬프 기반)';
COMMENT ON COLUMN public.reports.teacher_id IS '선생님 프로필 UUID (profiles 테이블 참조)';
COMMENT ON COLUMN public.reports.teacher_name IS '선생님 이름';
COMMENT ON COLUMN public.reports.score_student_participation IS '학생 참여도 점수 (0-20)';
COMMENT ON COLUMN public.reports.score_concept_explanation IS '개념 설명 점수 (0-20)';
COMMENT ON COLUMN public.reports.score_feedback IS '피드백 점수 (0-20)';
COMMENT ON COLUMN public.reports.score_structure IS '수업 체계성 점수 (0-20)';
COMMENT ON COLUMN public.reports.score_interaction IS '상호작용 점수 (0-20)';
COMMENT ON COLUMN public.reports.total_score IS '총점 (5개 영역 합계, 0-100)';
COMMENT ON COLUMN public.reports.strengths IS '우수점 배열 (JSONB)';
COMMENT ON COLUMN public.reports.improvements IS '개선점 배열 (JSONB)';
COMMENT ON COLUMN public.reports.highlights IS '수업 하이라이트 배열 (JSONB)';

-- 7. 확인용 쿼리
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;
