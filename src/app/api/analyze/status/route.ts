import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

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

export async function GET(req: NextRequest) {
  try {
    const transcriptId = req.nextUrl.searchParams.get('transcriptId');

    if (!transcriptId) {
      return NextResponse.json({ error: 'transcriptId가 필요합니다.' }, { status: 400 });
    }

    const aai = getAssemblyAI();
    const transcript = await aai.transcripts.get(transcriptId);

    let progress = 30;
    let step = '대기 중...';

    switch (transcript.status) {
      case 'queued':
        progress = 20;
        step = 'AssemblyAI 대기열에서 대기 중...';
        break;
      case 'processing':
        progress = 50;
        step = '음성 인식 처리 중...';
        break;
      case 'completed':
        progress = 70;
        step = '음성 인식 완료! 분석 준비 중...';
        break;
      case 'error':
        progress = 0;
        step = '음성 인식 오류 발생';
        break;
    }

    return NextResponse.json({
      status: transcript.status,
      progress,
      step,
      error: transcript.error || null,
    });

  } catch (error) {
    console.error('❌ Status error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '상태 확인 실패'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
