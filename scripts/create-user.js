// Supabase에 사용자 생성 스크립트
// 실행: node scripts/create-user.js

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.log('SUPABASE_URL:', SUPABASE_URL ? '있음' : '없음');
  console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '있음' : '없음');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// 생성할 사용자 정보
const users = [
  {
    email: 'youngjik@test.com',
    password: 'test1234',
    full_name: '이영직',
    role: 'teacher'
  }
];

async function createUser(userData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // 이메일 확인 건너뛰기
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/auth/v1/admin/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: result });
          } else {
            resolve({ success: false, error: result });
          }
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function createProfile(userId, userData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      id: userId,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role
    });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/profiles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: result });
          } else {
            resolve({ success: false, error: result });
          }
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Supabase 사용자 생성 시작...\n');
  console.log('📍 Project:', projectRef);
  console.log('');

  for (const userData of users) {
    console.log(`\n👤 ${userData.email} 생성 중...`);
    
    // 1. Auth 사용자 생성
    const authResult = await createUser(userData);
    
    if (authResult.success) {
      console.log(`  ✅ Auth 사용자 생성 완료`);
      console.log(`  🆔 User ID: ${authResult.data.id}`);
      
      // 2. Profile 생성
      const profileResult = await createProfile(authResult.data.id, userData);
      
      if (profileResult.success) {
        console.log(`  ✅ Profile 생성 완료`);
      } else {
        console.log(`  ⚠️ Profile 생성 실패:`, profileResult.error);
        console.log(`  💡 이미 존재하거나 트리거로 자동 생성되었을 수 있습니다.`);
      }
    } else {
      if (authResult.error?.message?.includes('already been registered') || 
          authResult.error?.msg?.includes('already been registered')) {
        console.log(`  ⚠️ 이미 등록된 이메일입니다. 비밀번호를 업데이트합니다...`);
        
        // 기존 사용자 비밀번호 업데이트 시도
        const updateResult = await updateUserPassword(userData.email, userData.password);
        if (updateResult.success) {
          console.log(`  ✅ 비밀번호 업데이트 완료`);
        } else {
          console.log(`  ❌ 비밀번호 업데이트 실패:`, updateResult.error);
        }
      } else {
        console.log(`  ❌ Auth 사용자 생성 실패:`, authResult.error);
      }
    }
  }

  console.log('\n✨ 완료!\n');
  console.log('📋 생성된 계정:');
  console.log('-------------------');
  for (const u of users) {
    console.log(`📧 ${u.email}`);
    console.log(`🔑 ${u.password}`);
    console.log(`👤 ${u.full_name} (${u.role})`);
    console.log('');
  }
}

async function updateUserPassword(email, newPassword) {
  // 먼저 사용자 찾기
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const result = JSON.parse(data);
          if (result.users && result.users.length > 0) {
            const userId = result.users[0].id;
            
            // 비밀번호 업데이트
            const updateResult = await updatePassword(userId, newPassword);
            resolve(updateResult);
          } else {
            resolve({ success: false, error: '사용자를 찾을 수 없음' });
          }
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updatePassword(userId, newPassword) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      password: newPassword
    });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: `/auth/v1/admin/users/${userId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

main().catch(console.error);
