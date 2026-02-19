import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { videoPath, reportId } = await req.json();

    if (!videoPath || !reportId) {
      return NextResponse.json({ error: 'videoPath와 reportId가 필요합니다.' }, { status: 400 });
    }

    // 1. Supabase Storage에서 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    const videoUrl = urlData.publicUrl;
    console.log('📎 Video URL for AssemblyAI:', videoUrl);

    // 2. AssemblyAI에 제출 (비동기 - 완료까지 기다리지 않음)
    const aai = getAssemblyAI();
    const transcript = await aai.transcripts.submit({
      audio_url: videoUrl,
      language_code: 'en',
      punctuate: true,
      format_text: true,
      speaker_labels: true,
      word_boost: ['teacher', 'student', 'math', 'problem', 'answer', 'calculation', 'fraction', 'multiplication', 'division'],
      boost_param: 'high',
      filter_profanity: false,
      disfluencies: false,
      entity_detection: true,
    });

    console.log('✅ AssemblyAI 제출 완료:', { transcriptId: transcript.id, status: transcript.status });

    return NextResponse.json({
      transcriptId: transcript.id,
      status: 'transcribing',
    });

  } catch (error) {
    console.error('❌ Transcribe error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '트랜스크립션 시작 실패'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
