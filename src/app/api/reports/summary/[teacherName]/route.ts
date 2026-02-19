import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: 특정 선생님의 종합 평가 데이터
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherName: string }> }
) {
  try {
    const { teacherName } = await params;
    const decodedName = decodeURIComponent(teacherName);

    // 해당 선생님의 모든 보고서 조회
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('teacher_name', decodedName)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('보고서 조회 오류:', error);
      return NextResponse.json(
        { error: '보고서를 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        success: true,
        teacherName: decodedName,
        summary: null,
        message: '보고서가 없습니다.'
      });
    }

    // 평균 점수 계산
    const totalReports = reports.length;
    const avgScores = {
      student_participation: 0,
      concept_explanation: 0,
      feedback: 0,
      structure: 0,
      interaction: 0,
      total: 0
    };

    reports.forEach(report => {
      avgScores.student_participation += report.score_student_participation || 0;
      avgScores.concept_explanation += report.score_concept_explanation || 0;
      avgScores.feedback += report.score_feedback || 0;
      avgScores.structure += report.score_structure || 0;
      avgScores.interaction += report.score_interaction || 0;
      avgScores.total += report.total_score || 0;
    });

    // 평균 계산
    Object.keys(avgScores).forEach(key => {
      avgScores[key as keyof typeof avgScores] = Math.round(
        avgScores[key as keyof typeof avgScores] / totalReports * 10
      ) / 10;
    });

    // 점수 추이 데이터 (시간순)
    const scoreHistory = reports.map(report => ({
      date: report.created_at,
      title: report.title,
      report_id: report.report_id,
      student_participation: report.score_student_participation,
      concept_explanation: report.score_concept_explanation,
      feedback: report.score_feedback,
      structure: report.score_structure,
      interaction: report.score_interaction,
      total: report.total_score
    }));

    // 강점/개선점 종합 (빈도 분석) - 한글
    const strengthsMap = new Map<string, number>();
    const improvementsMap = new Map<string, number>();
    
    // 강점/개선점 종합 (빈도 분석) - 영어
    const strengthsMapEn = new Map<string, number>();
    const improvementsMapEn = new Map<string, number>();

    reports.forEach(report => {
      // 한글
      (report.strengths || []).forEach((s: string) => {
        const key = s.substring(0, 50); // 앞 50자로 그룹화
        strengthsMap.set(key, (strengthsMap.get(key) || 0) + 1);
      });
      (report.improvements || []).forEach((i: string) => {
        const key = i.substring(0, 50);
        improvementsMap.set(key, (improvementsMap.get(key) || 0) + 1);
      });
      
      // 영어
      (report.strengths_en || []).forEach((s: string) => {
        const key = s.substring(0, 50);
        strengthsMapEn.set(key, (strengthsMapEn.get(key) || 0) + 1);
      });
      (report.improvements_en || []).forEach((i: string) => {
        const key = i.substring(0, 50);
        improvementsMapEn.set(key, (improvementsMapEn.get(key) || 0) + 1);
      });
    });

    // 빈도순 정렬 - 한글
    const topStrengths = Array.from(strengthsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const topImprovements = Array.from(improvementsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));
    
    // 빈도순 정렬 - 영어
    const topStrengthsEn = Array.from(strengthsMapEn.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    const topImprovementsEn = Array.from(improvementsMapEn.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    // 최고/최저 점수
    const scores = reports.map(r => r.total_score || 0);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const recentScore = reports[reports.length - 1]?.total_score || 0;

    // 성장 추세 (최근 3개 vs 이전 3개)
    let trend = 'stable';
    if (reports.length >= 6) {
      const recent3 = reports.slice(-3).reduce((sum, r) => sum + (r.total_score || 0), 0) / 3;
      const prev3 = reports.slice(-6, -3).reduce((sum, r) => sum + (r.total_score || 0), 0) / 3;
      if (recent3 > prev3 + 2) trend = 'improving';
      else if (recent3 < prev3 - 2) trend = 'declining';
    }

    return NextResponse.json({
      success: true,
      teacherName: decodedName,
      summary: {
        totalReports,
        averageScores: avgScores,
        scoreHistory,
        maxScore,
        minScore,
        recentScore,
        trend,
        topStrengths,
        topImprovements,
        topStrengths_en: topStrengthsEn,
        topImprovements_en: topImprovementsEn,
        firstReportDate: reports[0]?.created_at,
        lastReportDate: reports[reports.length - 1]?.created_at
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
