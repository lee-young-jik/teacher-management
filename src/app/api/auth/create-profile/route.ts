import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 비밀번호가 있으면 Admin API로 사용자 생성 (이메일 확인 건너뛰기)
    if (password) {
      // 1. Admin API로 Auth 사용자 생성
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // 이메일 확인 건너뛰기
        user_metadata: {
          full_name: full_name,
          role: role
        }
      });

      if (createError) {
        console.error('Auth 사용자 생성 실패:', createError);
        
        if (createError.message?.includes('already been registered')) {
          return NextResponse.json(
            { error: '이미 등록된 이메일입니다.' },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: `사용자 생성 실패: ${createError.message}` },
          { status: 500 }
        );
      }

      // 2. Profiles 테이블에 추가
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          full_name: full_name,
          role: role
        })
        .select()
        .single();

      if (profileError) {
        console.error('프로필 생성 실패:', profileError);
        // 프로필 생성 실패해도 Auth 사용자는 생성됨 - 경고만 출력
        console.warn('프로필 생성은 실패했지만 Auth 사용자는 생성됨');
      }

      console.log('✅ 회원가입 완료:', { email, full_name, role });

      return NextResponse.json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: newUser.user,
        profile
      });
    }

    // 비밀번호 없으면 기존 사용자 프로필만 생성
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Auth 사용자 조회 실패:', authError);
      return NextResponse.json({ error: 'Auth 조회 실패' }, { status: 500 });
    }

    const authUser = authData.users.find(u => u.email === email);
    
    if (!authUser) {
      return NextResponse.json(
        { error: '인증된 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 프로필이 있는지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { message: '프로필이 이미 존재합니다.', profile: existingProfile },
        { status: 200 }
      );
    }

    // Profiles 테이블에 추가
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: email,
        full_name: full_name,
        role: role
      })
      .select()
      .single();

    if (profileError) {
      console.error('프로필 생성 실패:', profileError);
      return NextResponse.json(
        { error: `프로필 생성 실패: ${profileError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 생성되었습니다.',
      profile
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
