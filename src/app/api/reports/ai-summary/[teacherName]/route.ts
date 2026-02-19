import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1'
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherName: string }> }
) {
  try {
    const resolvedParams = await params;
    const teacherName = decodeURIComponent(resolvedParams.teacherName);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ko';

    // 해당 선생님의 모든 보고서 가져오기
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('teacher_name', teacherName)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ 
        error: '보고서가 없습니다.',
        aiSummary: null
      }, { status: 404 });
    }

    // 보고서 데이터 요약 생성
    const reportSummaries = reports.map((report, index) => ({
      회차: index + 1,
      제목: report.title || '제목 없음',
      날짜: new Date(report.created_at).toLocaleDateString('ko-KR'),
      총점: report.total_score,
      학생참여: report.score_student_participation,
      개념설명: report.score_concept_explanation,
      피드백: report.score_feedback,
      체계성: report.score_structure,
      상호작용: report.score_interaction,
      강점: report.strengths || [],
      개선점: report.improvements || []
    }));

    // 평균 점수 계산
    const avgScores = {
      total: Math.round(reports.reduce((sum, r) => sum + (r.total_score || 0), 0) / reports.length),
      student_participation: Math.round(reports.reduce((sum, r) => sum + (r.score_student_participation || 0), 0) / reports.length),
      concept_explanation: Math.round(reports.reduce((sum, r) => sum + (r.score_concept_explanation || 0), 0) / reports.length),
      feedback: Math.round(reports.reduce((sum, r) => sum + (r.score_feedback || 0), 0) / reports.length),
      structure: Math.round(reports.reduce((sum, r) => sum + (r.score_structure || 0), 0) / reports.length),
      interaction: Math.round(reports.reduce((sum, r) => sum + (r.score_interaction || 0), 0) / reports.length)
    };

    // 점수 추세 계산
    const firstHalf = reports.slice(0, Math.ceil(reports.length / 2));
    const secondHalf = reports.slice(Math.ceil(reports.length / 2));
    const firstAvg = firstHalf.reduce((sum, r) => sum + (r.total_score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, r) => sum + (r.total_score || 0), 0) / secondHalf.length 
      : firstAvg;
    const trend = secondAvg > firstAvg + 3 ? '상승' : secondAvg < firstAvg - 3 ? '하락' : '안정';

    // 모든 강점과 개선점 수집
    const allStrengths = reports.flatMap(r => r.strengths || []).filter(Boolean);
    const allImprovements = reports.flatMap(r => r.improvements || []).filter(Boolean);

    // LLM 프롬프트 생성 (언어별)
    const isEnglish = language === 'en';
    
    let prompt = '';
    
    if (isEnglish) {
      prompt = `You are an education expert. Here is the lesson analysis data for this teacher. 
Please write a comprehensive teacher evaluation report based on this data.


## Teacher Information
- Total lessons analyzed: ${reports.length}
- Analysis period: ${new Date(reports[0].created_at).toLocaleDateString('en-US')} ~ ${new Date(reports[reports.length - 1].created_at).toLocaleDateString('en-US')}

## Average Scores (out of 100)
- Total: ${avgScores.total} points
- Student Engagement: ${avgScores.student_participation}/20
- Concept Clarity: ${avgScores.concept_explanation}/20
- Feedback Quality: ${avgScores.feedback}/20
- Lesson Structure: ${avgScores.structure}/20
- Interaction: ${avgScores.interaction}/20

## Score Trends
- First half average: ${Math.round(firstAvg)} points
- Second half average: ${Math.round(secondAvg)} points
- Trend: ${trend === '상승' ? 'Rising' : trend === '하락' ? 'Declining' : 'Stable'}

## Score Changes by Lesson
${reportSummaries.map(r => `Lesson ${r.회차} (${new Date(r.날짜).toLocaleDateString('en-US')}): ${r.총점} points`).join('\n')}

## Key Strengths (frequently mentioned)
${allStrengths.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'No data'}

## Areas for Improvement (frequently mentioned)
${allImprovements.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'No data'}

---

Please analyze the data above and write a comprehensive evaluation report in the following format:

1. **Overall Assessment (2-3 sentences)**
   - Evaluation of overall teaching competency

2. **Core Strengths (3 items)**
   - Describe specific strengths unique to this teacher

3. **Growth Points (2-3 items)**
   - Constructively suggest areas for improvement

4. **Recommended Action Plan (2-3 items)**
   - Provide specific, actionable improvement strategies

5. **Growth Potential Assessment**
   - Opinion on future development potential

Please write in English with encouraging yet practically helpful content.
Write in natural sentences, not JSON format.`;
    } else {
      prompt = `당신은 교육 전문가입니다. 다음은 해당 선생님의 수업 분석 데이터입니다. 
이 데이터를 바탕으로 종합적인 교사 평가 보고서를 작성해주세요.


## 선생님 정보
- 총 분석 수업 횟수: ${reports.length}회
- 분석 기간: ${new Date(reports[0].created_at).toLocaleDateString('ko-KR')} ~ ${new Date(reports[reports.length - 1].created_at).toLocaleDateString('ko-KR')}

## 평균 점수 (100점 만점)
- 총점: ${avgScores.total}점
- 학생 참여 유도: ${avgScores.student_participation}/20점
- 개념 설명 명확성: ${avgScores.concept_explanation}/20점
- 피드백 품질: ${avgScores.feedback}/20점
- 수업 체계성: ${avgScores.structure}/20점
- 상호작용: ${avgScores.interaction}/20점

## 점수 추세
- 전반기 평균: ${Math.round(firstAvg)}점
- 후반기 평균: ${Math.round(secondAvg)}점
- 추세: ${trend}

## 수업별 점수 변화
${reportSummaries.map(r => `${r.회차}회차 (${r.날짜}): ${r.총점}점`).join('\n')}

## 주요 강점 (수업에서 자주 언급된 우수점)
${allStrengths.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n') || '데이터 없음'}

## 개선 필요 사항 (수업에서 자주 언급된 개선점)
${allImprovements.slice(0, 10).map((s, i) => `${i + 1}. ${s}`).join('\n') || '데이터 없음'}

---

위 데이터를 분석하여 다음 형식으로 종합 평가 보고서를 작성해주세요:

1. **종합 평가 (2-3문장)**
   - 전반적인 교수 역량에 대한 평가

2. **핵심 강점 (3가지)**
   - 이 선생님만의 특별한 강점을 구체적으로 서술

3. **성장 포인트 (2-3가지)**
   - 더 나은 수업을 위해 개선하면 좋을 점을 건설적으로 제안

4. **추천 액션 플랜 (2-3가지)**
   - 구체적이고 실행 가능한 개선 방안 제시

5. **성장 가능성 평가**
   - 향후 발전 가능성에 대한 의견

응답은 반드시 한국어로 작성하고, 교사에게 격려가 되면서도 실질적인 도움이 되는 내용으로 작성해주세요.
JSON 형식이 아닌 자연스러운 문장으로 작성해주세요.`;
    }

    // OpenRouter API 호출 (Google Gemini)
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: isEnglish 
            ? 'You are an education consultant with 15 years of experience. You analyze teacher lesson data and write constructive, encouraging comprehensive evaluation reports.'
            : '당신은 15년 경력의 교육 컨설턴트입니다. 교사의 수업 데이터를 분석하여 건설적이고 격려가 되는 종합 평가 보고서를 작성합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiSummary = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      teacherName,
      totalReports: reports.length,
      avgScores,
      trend,
      aiSummary
    });

  } catch (error) {
    console.error('AI 종합 분석 오류:', error);
    return NextResponse.json({ 
      error: 'AI 분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
