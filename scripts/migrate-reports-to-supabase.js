/**
 * 기존 JSON 보고서를 Supabase로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * 1. 먼저 Supabase SQL Editor에서 scripts/setup-reports-table.sql 실행
 * 2. node scripts/migrate-reports-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const REPORTS_DIR = path.join(__dirname, '..', 'public', 'reports');

async function migrateReports() {
  console.log('📂 보고서 마이그레이션 시작...');
  console.log('   경로:', REPORTS_DIR);

  // reports 디렉토리 내 선생님 폴더 목록 가져오기
  const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });
  
  let totalMigrated = 0;
  let totalFailed = 0;
  const errors = [];

  for (const entry of entries) {
    // .json 파일은 건너뛰기 (이전 형식)
    if (!entry.isDirectory()) {
      console.log(`   ⏭️ 건너뜀 (파일): ${entry.name}`);
      continue;
    }

    const teacherName = entry.name;
    const teacherDir = path.join(REPORTS_DIR, teacherName);
    
    console.log(`\n👤 선생님: ${teacherName}`);

    // 선생님 폴더 내 보고서 ID 폴더들
    const reportFolders = fs.readdirSync(teacherDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);

    for (const reportId of reportFolders) {
      const analysisPath = path.join(teacherDir, reportId, 'analysis.json');
      
      // analysis.json 파일이 없으면 건너뛰기
      if (!fs.existsSync(analysisPath)) {
        console.log(`   ⏭️ 건너뜀 (analysis.json 없음): ${reportId}`);
        continue;
      }

      try {
        // analysis.json 읽기
        let analysisContent = fs.readFileSync(analysisPath, 'utf8');
        
        // BOM 제거
        if (analysisContent.charCodeAt(0) === 0xFEFF) {
          analysisContent = analysisContent.slice(1);
        }
        
        const analysis = JSON.parse(analysisContent);
        
        // 점수 파싱
        const scores = analysis.scores || {};
        
        const reportData = {
          report_id: reportId,
          teacher_id: null,
          teacher_name: analysis.teacherId || teacherName,
          title: analysis.title || '제목 없음',
          filename: analysis.filename || null,
          file_size: analysis.fileSize || null,
          video_duration: analysis.videoDuration || null,
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
          strengths: analysis['우수점'] || analysis.strengths || [],
          improvements: analysis['개선점'] || analysis.improvements || [],
          highlights: analysis.highlights || [],
          created_at: analysis.uploadDate || new Date().toISOString()
        };

        // Supabase에 저장
        const { error } = await supabase
          .from('reports')
          .upsert(reportData, { onConflict: 'report_id' });

        if (error) {
          console.log(`   ❌ 실패: ${reportId} - ${error.message}`);
          errors.push({ reportId, teacherName, error: error.message });
          totalFailed++;
        } else {
          console.log(`   ✅ 성공: ${reportId} (${analysis.title || '제목 없음'})`);
          totalMigrated++;
        }

      } catch (err) {
        console.log(`   ❌ 오류: ${reportId} - ${err.message}`);
        errors.push({ reportId, teacherName, error: err.message });
        totalFailed++;
      }
    }
  }

  console.log('\n========================================');
  console.log('📊 마이그레이션 결과:');
  console.log(`   ✅ 성공: ${totalMigrated}개`);
  console.log(`   ❌ 실패: ${totalFailed}개`);
  
  if (errors.length > 0) {
    console.log('\n❌ 실패한 항목:');
    errors.forEach(e => {
      console.log(`   - ${e.teacherName}/${e.reportId}: ${e.error}`);
    });
  }
  
  console.log('========================================\n');
}

// 실행
migrateReports()
  .then(() => {
    console.log('✅ 마이그레이션 완료!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
  });
