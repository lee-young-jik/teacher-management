import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { fileName, teacherId, title, lessonDate, fileSize } = await req.json();

    if (!fileName || !teacherId) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 파일 크기 체크 (50MB 제한 - Supabase 무료 플랜)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다. (현재: ${(fileSize / 1024 / 1024).toFixed(1)}MB)`
      }, { status: 400 });
    }

    // 1. 'videos' 버킷 생성/업데이트
    const { data: buckets } = await supabase.storage.listBuckets();
    const videoBucket = buckets?.find((b: any) => b.name === 'videos');
    
    if (!videoBucket) {
      // 버킷 생성
      const { error: bucketError } = await supabase.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
      });
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('버킷 생성 실패:', bucketError);
        // fileSizeLimit 없이 재시도
        const { error: retryError } = await supabase.storage.createBucket('videos', {
          public: true,
        });
        if (retryError && !retryError.message.includes('already exists')) {
          throw new Error(`버킷 생성 실패: ${retryError.message}`);
        }
      }
      console.log('✅ videos 버킷 생성 완료');
    } else {
      // 기존 버킷 설정 업데이트 (public 확인)
      try {
        await supabase.storage.updateBucket('videos', {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
        });
      } catch (e) {
        // 업데이트 실패해도 계속 진행
        console.warn('버킷 업데이트 실패 (무시 가능):', e);
      }
    }

    // 2. reportId 생성
    const reportId = Date.now().toString();

    // 3. 고유 파일 경로 생성
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const videoPath = `${teacherId}/${reportId}_${safeName}`;

    // 4. 서명된 업로드 URL 생성 (2시간 유효)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(videoPath);

    if (signedError) {
      console.error('서명 URL 생성 실패:', signedError);
      throw new Error(`업로드 URL 생성 실패: ${signedError.message}`);
    }

    console.log('✅ 서명된 업로드 URL 생성 완료:', { reportId, videoPath, fileSize });

    return NextResponse.json({
      reportId,
      videoPath,
      token: signedData.token,
    });

  } catch (error) {
    console.error('❌ Start error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '초기화 실패'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
