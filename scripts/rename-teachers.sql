-- =====================================================
-- 선생님 이름을 Teacher A, Teacher B 형식으로 변경
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1단계: 현재 선생님 목록 확인 (실행 전 확인용)
SELECT DISTINCT teacher_name 
FROM public.reports 
ORDER BY teacher_name;

-- 2단계: 이름 매핑 및 업데이트
-- 주의: 아래 매핑이 맞는지 확인 후 실행하세요!

BEGIN;

-- reports 테이블 업데이트
UPDATE public.reports 
SET teacher_name = 'Teacher A'
WHERE teacher_name = '이영직';

UPDATE public.reports 
SET teacher_name = 'Teacher B'
WHERE teacher_name = '백재현';

UPDATE public.reports 
SET teacher_name = 'Teacher C'
WHERE teacher_name = '이선생';

UPDATE public.reports 
SET teacher_name = 'Teacher D'
WHERE teacher_name = '선생님';

-- profiles 테이블도 업데이트 (있는 경우)
UPDATE public.profiles 
SET full_name = 'Teacher A'
WHERE full_name = '이영직';

UPDATE public.profiles 
SET full_name = 'Teacher B'
WHERE full_name = '백재현';

UPDATE public.profiles 
SET full_name = 'Teacher C'
WHERE full_name = '이선생';

UPDATE public.profiles 
SET full_name = 'Teacher D'
WHERE full_name = '선생님';

COMMIT;

-- 3단계: 결과 확인
SELECT DISTINCT teacher_name, COUNT(*) as report_count
FROM public.reports 
GROUP BY teacher_name
ORDER BY teacher_name;

SELECT full_name, role
FROM public.profiles
WHERE role = 'teacher'
ORDER BY full_name;
