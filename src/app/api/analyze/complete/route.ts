import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AssemblyAI } from 'assemblyai';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// OpenRouter 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// AssemblyAI 클라이언트 (lazy)
let assemblyai: AssemblyAI | null = null;
function getAssemblyAI(): AssemblyAI {
  if (!assemblyai) {
    if (!process.env.AAI_API_KEY) {
      throw new Error('AAI_API_KEY가 설정되지 않았습니다.');
    }
    assemblyai = new AssemblyAI({ apiKey: process.env.AAI_API_KEY });
  }
  return assemblyai;
}

// 평가 점수 타입 정의
interface AnalysisResult {
  scores: Record<string, number>;
  우수점: string[];
  우수점_en: string[];
  개선점: string[];
  개선점_en: string[];
  highlights: {
    timestamp: string;
    teacherText: string;
    studentText: string;
    reason: string;
    reason_en: string;
    type: '개념이해' | '적극참여' | '긍정피드백';
  }[];
}

// OpenAI 응답을 파싱하여 구조화된 데이터로 변환
function parseAnalysisResult(text: string): AnalysisResult {
  const scores: Record<string, number> = {};
  const 우수점: string[] = [];
  const 우수점_en: string[] = [];
  const 개선점: string[] = [];
  const 개선점_en: string[] = [];
  const highlights: AnalysisResult['highlights'] = [];

  // 점수 파싱
  const scoreLines = text.match(/[^:\n]+:\s*\d+/g) || [];
  for (const line of scoreLines) {
    const [category, scoreStr] = line.split(':').map(s => s.trim());
    const score = parseInt(scoreStr);
    if (!isNaN(score)) {
      switch (category) {
        case '학생 참여': scores['학생_참여도'] = score; break;
        case '개념 설명': scores['개념_설명'] = score; break;
        case '피드백': scores['피드백'] = score; break;
        case '체계성': scores['수업_체계성'] = score; break;
        case '상호작용': scores['상호작용'] = score; break;
      }
    }
  }

  // 우수점 파싱
  const 우수점Start = text.indexOf('우수점:');
  const 우수점EnStart = text.indexOf('우수점(영어):');
  if (우수점Start !== -1 && 우수점EnStart !== -1) {
    const 우수점Text = text.slice(우수점Start, 우수점EnStart);
    const 우수점Lines = 우수점Text.split('\n').slice(1);
    우수점Lines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && !point.includes('점:') && !point.includes('영어')) {
        우수점.push(point);
      }
    });
  }

  // 우수점(영어) 파싱
  const 개선점Start = text.indexOf('개선점:');
  if (우수점EnStart !== -1 && 개선점Start !== -1) {
    const 우수점EnText = text.slice(우수점EnStart, 개선점Start);
    const 우수점EnLines = 우수점EnText.split('\n').slice(1);
    우수점EnLines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && !point.includes('점:') && !point.includes('영어')) {
        우수점_en.push(point);
      }
    });
  }

  // 개선점 파싱
  const 개선점EnStart = text.indexOf('개선점(영어):');
  if (개선점Start !== -1 && 개선점EnStart !== -1) {
    const 개선점Text = text.slice(개선점Start, 개선점EnStart);
    const 개선점Lines = 개선점Text.split('\n').slice(1);
    개선점Lines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && !point.includes('점:') && !point.includes('영어')) {
        개선점.push(point);
      }
    });
  }

  // 개선점(영어) 파싱
  const 하이라이트Start = text.indexOf('하이라이트:');
  if (개선점EnStart !== -1) {
    const 개선점EnEnd = 하이라이트Start !== -1 ? 하이라이트Start : text.length;
    const 개선점EnText = text.slice(개선점EnStart, 개선점EnEnd);
    const 개선점EnLines = 개선점EnText.split('\n').slice(1);
    개선점EnLines.forEach(line => {
      const point = line.replace(/^[- \d.]+/, '').trim();
      if (point && 
          !point.includes('점:') && 
          !point.includes('영어') &&
          !point.includes('하이라이트') && 
          !point.startsWith('시간:') &&
          !point.startsWith('교사:') &&
          !point.startsWith('학생:') &&
          !point.startsWith('이유:') &&
          !point.startsWith('유형:')) {
        개선점_en.push(point);
      }
    });
  }

  // 하이라이트 파싱
  let currentHighlight: Partial<AnalysisResult['highlights'][0]> = {};

  if (하이라이트Start !== -1) {
    const 하이라이트Text = text.slice(하이라이트Start, text.length);
    const 하이라이트Lines = 하이라이트Text.split('\n').slice(1);
    currentHighlight = {};

    하이라이트Lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.startsWith('시간:')) {
        if (Object.keys(currentHighlight).length > 0) {
          highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
          currentHighlight = {};
        }
        currentHighlight.timestamp = trimmedLine.replace('시간:', '').trim();
      } else if (trimmedLine.startsWith('교사:')) {
        currentHighlight.teacherText = trimmedLine.replace('교사:', '').trim();
      } else if (trimmedLine.startsWith('학생:')) {
        currentHighlight.studentText = trimmedLine.replace('학생:', '').trim();
      } else if (trimmedLine.startsWith('이유(영어):')) {
        currentHighlight.reason_en = trimmedLine.replace('이유(영어):', '').trim();
      } else if (trimmedLine.startsWith('이유:')) {
        currentHighlight.reason = trimmedLine.replace('이유:', '').trim();
      } else if (trimmedLine.startsWith('유형:')) {
        const type = trimmedLine.replace('유형:', '').trim();
        if (['개념이해', '적극참여', '긍정피드백'].includes(type)) {
          currentHighlight.type = type as '개념이해' | '적극참여' | '긍정피드백';
        }
      }
    });

    if (Object.keys(currentHighlight).length > 0) {
      highlights.push(currentHighlight as AnalysisResult['highlights'][0]);
    }
  }

  return { scores, 우수점, 우수점_en, 개선점, 개선점_en, highlights };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { transcriptId, reportId, teacherId, title, lessonDate, fileName, fileSize } = await req.json();

    if (!transcriptId || !reportId) {
      return NextResponse.json({ error: 'transcriptId와 reportId가 필요합니다.' }, { status: 400 });
    }

    console.log('🤖 Complete 시작:', { transcriptId, reportId, teacherId });

    // 1. AssemblyAI에서 완료된 트랜스크립트 가져오기
    const aai = getAssemblyAI();
    const transcript = await aai.transcripts.get(transcriptId);

    if (transcript.status !== 'completed') {
      return NextResponse.json({ 
        error: `트랜스크립션이 아직 완료되지 않았습니다. 상태: ${transcript.status}` 
      }, { status: 400 });
    }

    // 2. 화자 구분 개선 (교육 상황 특화)
    if (transcript.utterances && transcript.utterances.length > 0) {
      transcript.utterances = transcript.utterances.map((utterance) => {
        const text = utterance.text.trim();
        
        const teacherPatterns = [
          /^(좋아요|잘했어|맞아요|그렇죠|네|자|이제|그럼|봅시다)/,
          /선생님|교사|설명|문제|질문/,
          /(어떻게|무엇을|왜|어디서).*(할까요|인가요|일까요)/,
          /답은|정답|계산|해결/
        ];
        
        const studentPatterns = [
          /^(네|아니요|모르겠어요|잘 모르겠어요)/,
          /선생님|질문있어요|도와주세요/,
          /^[0-9]+$/,
          /(이해|못해|어려워|쉬워)/
        ];
        
        const isLikelyTeacher = teacherPatterns.some(p => p.test(text)) || 
                               (text.length > 80 && !text.match(/^[0-9\s]+$/));
        const isLikelyStudent = studentPatterns.some(p => p.test(text)) ||
                               (text.length < 30 && text.match(/^[0-9\s!?]+$/));
        
        if (isLikelyTeacher && utterance.speaker !== 'A') {
          return { ...utterance, speaker: 'A' };
        } else if (isLikelyStudent && utterance.speaker === 'A') {
          return { ...utterance, speaker: 'B' };
        }
        
        return utterance;
      });
      console.log('🔧 화자 구분 후처리 완료');
    }

    // 3. GPT 분석
    console.log('🤖 GPT 분석 시작...');
    const analysisResponse = await openai.chat.completions.create({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `당신은 한국어 교육 현장의 수업 대화를 분석하는 전문가입니다. 
                     음성인식 결과에 일부 오류가 있을 수 있으니, 전체적인 맥락을 파악하여 분석해주세요.
                     영어로 추출된 음성인식 결과를 받아서 한국어 교육 상황으로 이해하고 분석해주세요.
                     
                     다음 5개 항목을 0-20점으로 평가하고, 반드시 아래 형식으로만 응답해주세요:

                      학생 참여: [숫자]
                      개념 설명: [숫자]
                      피드백: [숫자]
                      체계성: [숫자]
                      상호작용: [숫자]

                      우수점:
                      - [구체적인 우수한 점 1]
                      - [구체적인 우수한 점 2]
                      - [구체적인 우수한 점 3]

                      우수점(영어):
                      - [Specific strength 1 in English]
                      - [Specific strength 2 in English]
                      - [Specific strength 3 in English]

                      개선점:
                      - [구체적인 개선할 점 1]
                      - [구체적인 개선할 점 2]
                      - [구체적인 개선할 점 3]

                      개선점(영어):
                      - [Specific improvement 1 in English]
                      - [Specific improvement 2 in English]
                      - [Specific improvement 3 in English]

                      하이라이트:
                      시간: [MM:SS 형식]
                      교사: [교사의 실제 발화 내용]
                      학생: [학생의 실제 발화 내용]
                      이유: [이 상호작용이 교육적으로 의미있는 구체적 이유]
                      이유(영어): [Educational significance in English]
                      유형: [개념이해/적극참여/긍정피드백 중 하나]
                      
                      시간: [MM:SS 형식]
                      교사: [교사의 실제 발화 내용]
                      학생: [학생의 실제 발화 내용]
                      이유: [이 상호작용이 교육적으로 의미있는 구체적 이유]
                      이유(영어): [Educational significance in English]
                      유형: [개념이해/적극참여/긍정피드백 중 하나]
                      
                      IMPORTANT: 하이라이트 정보는 반드시 '하이라이트:' 섹션 아래에만 작성하고, 개선점 섹션에는 포함하지 마세요.

                      평가 기준:
                      - 학생 참여: 학생들의 적극적 발언, 질문, 반응 정도
                      - 개념 설명: 교사의 명확하고 체계적인 개념 전달
                      - 피드백: 학생 답변에 대한 적절하고 건설적인 피드백
                      - 체계성: 수업의 논리적 흐름과 구조
                      - 상호작용: 교사-학생, 학생-학생 간 활발한 소통

                      평가 기준:
                       - 15-20점: 탁월한 성과
                       - 10-14점: 기본 요구사항 충족
                       - 5-9점: 개선 필요
                       - 0-4점: 심각한 문제
                      
                      주의사항:
                      - 영어로 추출된 음성인식 결과이지만 실제로는 한국어 수업임을 고려
                      - 음성인식 오류로 인한 반복/오타는 무시하고 전체 맥락으로 판단
                      - 실제 교육 상황의 자연스러운 대화 특성을 고려
                      - 최소 2-3개의 의미있는 하이라이트 포함`
        },
        {
          role: "user",
          content: `다음은 실제 수업 대화 내용입니다 (영어로 추출되었지만 실제로는 한국어 수업):

=== 교사 발화 (화자 A) ===
${transcript.utterances?.filter(msg => msg.speaker === "A").map((msg) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] ${msg.text}`
).join('\n') || '(발화 없음)'}

=== 학생 발화 (화자 B, C 등) ===
${transcript.utterances?.filter(msg => msg.speaker !== "A").map((msg) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] 화자 ${msg.speaker}: ${msg.text}`
).join('\n') || '(발화 없음)'}

=== 전체 대화 흐름 (시간순, 처음 20개) ===
${transcript.utterances?.slice(0, 20).map((msg) => 
  `[${Math.floor(msg.start / 1000 / 60)}:${String(Math.floor((msg.start / 1000) % 60)).padStart(2, '0')}] ${msg.speaker === 'A' ? '교사' : '학생'}: ${msg.text}`
).join('\n') || '(대화 없음)'}

총 발화 수: ${transcript.utterances?.length || 0}개
교사 발화 비율: ${Math.round((transcript.utterances?.filter(msg => msg.speaker === "A").length || 0) / (transcript.utterances?.length || 1) * 100)}%
학생 발화 비율: ${Math.round((transcript.utterances?.filter(msg => msg.speaker !== "A").length || 0) / (transcript.utterances?.length || 1) * 100)}%

주의: 위 대화 내용은 영어로 음성인식된 결과이지만, 실제로는 한국어 수업 상황입니다.`
        }
      ]
    });

    console.log('✅ GPT 분석 완료');

    // 4. 결과 파싱 및 저장
    if (!analysisResponse.choices[0].message?.content) {
      throw new Error('GPT 분석 결과가 비어있습니다.');
    }

    const analysisResult = parseAnalysisResult(analysisResponse.choices[0].message.content);

    // 비디오 재생 시간 추정
    let videoDuration = null;
    if (transcript.utterances && transcript.utterances.length > 0) {
      const lastUtterance = transcript.utterances[transcript.utterances.length - 1];
      const totalSeconds = Math.ceil(lastUtterance.end / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      videoDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // 5. Supabase에 보고서 저장
    const scores = analysisResult.scores || {};
    const lessonDateTime = lessonDate
      ? new Date(lessonDate + 'T12:00:00').toISOString()
      : new Date().toISOString();

    const reportData = {
      report_id: reportId,
      teacher_id: null,
      teacher_name: teacherId,
      title: title || (fileName ? fileName.replace(/\.[^/.]+$/, "") : '제목 없음'),
      filename: fileName || 'unknown',
      file_size: fileSize || 0,
      video_duration: videoDuration,
      score_student_participation: scores['학생_참여도'] || scores['학생_참여'] || 0,
      score_concept_explanation: scores['개념_설명'] || 0,
      score_feedback: scores['피드백'] || 0,
      score_structure: scores['수업_체계성'] || scores['체계성'] || 0,
      score_interaction: scores['상호작용'] || 0,
      total_score: (
        (scores['학생_참여도'] || scores['학생_참여'] || 0) +
        (scores['개념_설명'] || 0) +
        (scores['피드백'] || 0) +
        (scores['수업_체계성'] || scores['체계성'] || 0) +
        (scores['상호작용'] || 0)
      ),
      strengths: analysisResult.우수점 || [],
      strengths_en: analysisResult.우수점_en || [],
      improvements: analysisResult.개선점 || [],
      improvements_en: analysisResult.개선점_en || [],
      highlights: analysisResult.highlights || [],
      highlights_en: analysisResult.highlights?.map(h => ({
        timestamp: h.timestamp,
        teacherText: h.teacherText,
        studentText: h.studentText,
        reason: h.reason_en || h.reason,
        type: h.type
      })) || [],
      created_at: lessonDateTime
    };

    const { error: supabaseError } = await supabase
      .from('reports')
      .upsert(reportData, { onConflict: 'report_id' });

    if (supabaseError) {
      console.error('❌ Supabase 저장 오류:', supabaseError);
    } else {
      console.log('✅ Supabase 저장 완료:', reportId);
    }

    return NextResponse.json({
      status: 'completed',
      reportId,
    });

  } catch (error) {
    console.error('❌ Complete error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '분석 완료 실패'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
