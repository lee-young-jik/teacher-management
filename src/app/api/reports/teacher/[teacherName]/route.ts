import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: 특정 선생님의 보고서 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherName: string }> }
) {
  try {
    const { teacherName } = await params;
    const decodedName = decodeURIComponent(teacherName);

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('teacher_name', decodedName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('보고서 조회 오류:', error);
      return NextResponse.json(
        { error: '보고서를 불러올 수 없습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teacherName: decodedName,
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
