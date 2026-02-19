import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: 전체 통계 및 선생님 목록 (DB에 등록된 선생님만)
export async function GET(request: NextRequest) {
  try {
    // 1. DB에 등록된 선생님 목록 조회 (profiles 테이블에서 role='teacher')
    const { data: registeredTeachers, error: teacherError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('role', 'teacher');

    if (teacherError) {
      console.error('선생님 목록 조회 오류:', teacherError);
      return NextResponse.json(
        { error: '선생님 목록을 불러올 수 없습니다.', details: teacherError.message },
        { status: 500 }
      );
    }

    // 등록된 선생님 이름 목록
    const registeredTeacherNames = new Set(
      (registeredTeachers || []).map(t => t.full_name)
    );

    // 2. 모든 보고서 조회
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('통계 조회 오류:', error);
      return NextResponse.json(
        { error: '통계를 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    // 등록된 선생님이 없으면 빈 목록 반환
    if (!registeredTeachers || registeredTeachers.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalReports: 0,
          totalTeachers: 0,
          averageScore: 0,
          recentReports: [],
          teacherList: []
        }
      });
    }

    // 3. 등록된 선생님별 통계 초기화
    const teacherStats = new Map<string, {
      name: string;
      email: string;
      reportCount: number;
      totalScore: number;
      avgScore: number;
      lastReportDate: string | null;
      scores: {
        student_participation: number;
        concept_explanation: number;
        feedback: number;
        structure: number;
        interaction: number;
      };
    }>();

    // 등록된 선생님들로 초기화 (보고서가 없어도 목록에 포함)
    registeredTeachers.forEach(teacher => {
      teacherStats.set(teacher.full_name, {
        name: teacher.full_name,
        email: teacher.email,
        reportCount: 0,
        totalScore: 0,
        avgScore: 0,
        lastReportDate: null,
        scores: {
          student_participation: 0,
          concept_explanation: 0,
          feedback: 0,
          structure: 0,
          interaction: 0
        }
      });
    });

    // 4. 보고서 데이터로 통계 계산 (등록된 선생님의 보고서만)
    const validReports = (reports || []).filter(report => 
      registeredTeacherNames.has(report.teacher_name)
    );

    validReports.forEach(report => {
      const name = report.teacher_name;
      const existing = teacherStats.get(name);
      
      if (existing) {
        existing.reportCount++;
        existing.totalScore += report.total_score || 0;
        existing.scores.student_participation += report.score_student_participation || 0;
        existing.scores.concept_explanation += report.score_concept_explanation || 0;
        existing.scores.feedback += report.score_feedback || 0;
        existing.scores.structure += report.score_structure || 0;
        existing.scores.interaction += report.score_interaction || 0;
        if (!existing.lastReportDate || report.created_at > existing.lastReportDate) {
          existing.lastReportDate = report.created_at;
        }
      }
    });

    // 5. 평균 계산 및 배열로 변환
    const teacherList = Array.from(teacherStats.values()).map(teacher => {
      const count = teacher.reportCount;
      return {
        name: teacher.name,
        email: teacher.email,
        reportCount: count,
        avgScore: count > 0 ? Math.round(teacher.totalScore / count * 10) / 10 : 0,
        lastReportDate: teacher.lastReportDate,
        avgScores: count > 0 ? {
          student_participation: Math.round(teacher.scores.student_participation / count * 10) / 10,
          concept_explanation: Math.round(teacher.scores.concept_explanation / count * 10) / 10,
          feedback: Math.round(teacher.scores.feedback / count * 10) / 10,
          structure: Math.round(teacher.scores.structure / count * 10) / 10,
          interaction: Math.round(teacher.scores.interaction / count * 10) / 10
        } : {
          student_participation: 0,
          concept_explanation: 0,
          feedback: 0,
          structure: 0,
          interaction: 0
        }
      };
    }).sort((a, b) => b.avgScore - a.avgScore); // 평균 점수 높은 순

    // 6. 전체 평균 점수 (유효한 보고서만)
    const totalScore = validReports.reduce((sum, r) => sum + (r.total_score || 0), 0);
    const averageScore = validReports.length > 0 
      ? Math.round(totalScore / validReports.length * 10) / 10 
      : 0;

    // 7. 최근 보고서 10개 (등록된 선생님 것만)
    const recentReports = validReports.slice(0, 10).map(r => ({
      report_id: r.report_id,
      teacher_name: r.teacher_name,
      title: r.title,
      total_score: r.total_score,
      created_at: r.created_at
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalReports: validReports.length,
        totalTeachers: teacherList.length,
        averageScore,
        recentReports,
        teacherList
      }
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
