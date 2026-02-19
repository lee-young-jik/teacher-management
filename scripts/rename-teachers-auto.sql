-- =====================================================
-- 선생님 이름 자동 매핑 (알파벳 순서로)
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 임시 매핑 테이블 생성
CREATE TEMP TABLE teacher_mapping AS
WITH numbered_teachers AS (
  SELECT DISTINCT 
    teacher_name,
    ROW_NUMBER() OVER (ORDER BY teacher_name) as teacher_number
  FROM public.reports
)
SELECT 
  teacher_name as old_name,
  'Teacher ' || CHR(64 + teacher_number) as new_name  -- A=65, so 64+1=A
FROM numbered_teachers;

-- 매핑 확인
SELECT * FROM teacher_mapping ORDER BY old_name;

-- 아래 주석을 해제하고 실행하면 실제로 변경됩니다
-- 주의: 실행 전 위의 매핑을 확인하세요!

/*
BEGIN;

-- reports 테이블 업데이트
UPDATE public.reports r
SET teacher_name = m.new_name
FROM teacher_mapping m
WHERE r.teacher_name = m.old_name;

-- profiles 테이블 업데이트
UPDATE public.profiles p
SET full_name = m.new_name
FROM teacher_mapping m
WHERE p.full_name = m.old_name;

COMMIT;

-- 결과 확인
SELECT DISTINCT teacher_name, COUNT(*) as report_count
FROM public.reports 
GROUP BY teacher_name
ORDER BY teacher_name;
*/
