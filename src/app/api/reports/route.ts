import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: 전체 보고서 목록 조회 (원장용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherName = searchParams.get('teacher');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 선생님 필터
    if (teacherName) {
      query = query.eq('teacher_name', teacherName);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('보고서 조회 오류:', error);
      return NextResponse.json(
        { error: '보고서를 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 보고서 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      report_id,
      teacher_id,
      teacher_name,
      title,
      filename,
      file_size,
      video_duration,
      scores,
      strengths,
      improvements,
      highlights
    } = body;

    // 필수 필드 검증
    if (!report_id || !teacher_name) {
      return NextResponse.json(
        { error: 'report_id와 teacher_name은 필수입니다.' },
        { status: 400 }
      );
    }

    // 점수 파싱
    const scoreData = scores || {};
    const totalScore = (
      (scoreData.학생_참여도 || scoreData.학생_참여 || 0) +
      (scoreData.개념_설명 || 0) +
      (scoreData.피드백 || 0) +
      (scoreData.수업_체계성 || scoreData.체계성 || 0) +
      (scoreData.상호작용 || 0)
    );

    const reportData = {
      report_id,
      teacher_id: teacher_id || null,
      teacher_name,
      title: title || '제목 없음',
      filename: filename || null,
      file_size: file_size || null,
      video_duration: video_duration || null,
      score_student_participation: scoreData.학생_참여도 || scoreData.학생_참여 || 0,
      score_concept_explanation: scoreData.개념_설명 || 0,
      score_feedback: scoreData.피드백 || 0,
      score_structure: scoreData.수업_체계성 || scoreData.체계성 || 0,
      score_interaction: scoreData.상호작용 || 0,
      total_score: totalScore,
      strengths: strengths || [],
      improvements: improvements || [],
      highlights: highlights || []
    };

    const { data, error } = await supabase
      .from('reports')
      .upsert(reportData, { onConflict: 'report_id' })
      .select()
      .single();

    if (error) {
      console.error('보고서 저장 오류:', error);
      return NextResponse.json(
        { error: '보고서 저장에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '보고서가 저장되었습니다.'
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
