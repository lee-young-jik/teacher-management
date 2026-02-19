import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { reportId, title, teacherName } = await request.json();

    if (!reportId || !title) {
      return NextResponse.json(
        { error: '보고서 ID와 제목이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 보고서 제목 업데이트
    const { data, error } = await supabase
      .from('reports')
      .update({ title: title.trim() })
      .eq('report_id', reportId)
      .select()
      .single();

    if (error) {
      console.error('보고서 제목 업데이트 실패:', error);
      return NextResponse.json(
        { error: '보고서 제목 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '보고서 제목이 수정되었습니다.',
      data
    });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
