import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teacherId: string; reportId: string }> }
) {
  try {
    const params = await context.params;
    let { teacherId, reportId } = params;
    
    // URL 디코딩 처리
    try {
      teacherId = decodeURIComponent(teacherId);
      if (teacherId.includes('%')) {
        teacherId = decodeURIComponent(teacherId);
      }
    } catch (error) {
      console.error('URL 디코딩 오류:', error);
    }
    
    console.log('처리할 파라미터:', { teacherId, reportId });

    // 1. Supabase에서 먼저 조회
    try {
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('report_id', reportId)
        .single();

      if (report && !error) {
        console.log('Supabase에서 보고서 로드 완료:', reportId);
        
        // Supabase 데이터를 기존 형식으로 변환
        const analysisData = {
          reportId: report.report_id,
          title: report.title,
          teacherId: report.teacher_name,
          filename: report.filename,
          fileSize: report.file_size,
          uploadDate: report.created_at,
          videoDuration: report.video_duration,
          scores: {
            '학생_참여도': report.score_student_participation,
            '개념_설명': report.score_concept_explanation,
            '피드백': report.score_feedback,
            '수업_체계성': report.score_structure,
            '상호작용': report.score_interaction
          },
          '우수점': report.strengths || [],
          '우수점_en': report.strengths_en || [],
          '개선점': report.improvements || [],
          '개선점_en': report.improvements_en || [],
          highlights: report.highlights || [],
          highlights_en: report.highlights_en || []
          // transcript는 로컬 파일에서 로드
        };

        return NextResponse.json(analysisData);
      }
    } catch (supabaseError) {
      console.log('Supabase 조회 실패, 로컬 파일로 폴백:', supabaseError);
    }

    // 2. 로컬 파일에서 조회 (폴백)
    const projectRoot = process.cwd();
    const filePath = path.join(
      projectRoot,
      'public',
      'reports',
      teacherId,
      reportId,
      'analysis.json'
    );

    console.log('로컬 파일 경로:', filePath);

    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`파일이 존재하지 않음: ${filePath}`);
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const fileContent = await fs.readFile(filePath);
    let jsonString = fileContent.toString('utf8');
    
    // BOM 제거
    if (jsonString.charCodeAt(0) === 0xFEFF) {
      jsonString = jsonString.slice(1);
    }
    
    const analysis = JSON.parse(jsonString);
    console.log('로컬 파일에서 분석 결과 로드 완료');

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('분석 파일 로드 오류:', error);
    return NextResponse.json(
      { error: '분석 결과를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
