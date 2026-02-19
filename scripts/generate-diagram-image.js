const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = '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';

// 교사 버전 프롬프트
const teacherPrompt = `Generate a clean system architecture diagram image.

Style: Professional, minimalist, white background
- Person icon: dark silhouette (head and shoulders, NOT stick figure)
- Dashed border boxes for grouping
- Dark boxes with white text for servers
- Light blue boxes for AI services
- Gray boxes for utilities

LAYOUT:

[LEFT] Dark silhouette person icon, label "사용자 (교사)" below
  ↓ arrow going right
  ↑ arrow coming back left

[CENTER - dashed box "Frontend (UI)"]
  Box: "Frontend" / "Next.js"
  
  Arrow RIGHT labeled "영상 업로드" →
  Arrow LEFT labeled "리포트 반환" ←
  (TWO SEPARATE ARROWS, one going each direction)

[RIGHT - larger dashed box "API Server (Backend)"]
  Dark box: "API 서버" / "Next.js Routes"
  Gray box: "FFmpeg" / "오디오 추출"
  Blue box: "AssemblyAI" / "전사 + 화자구분"
  Blue box: "OpenRouter" / "Gemini 분석"

[BOTTOM]
  Database cylinder: "Supabase" (main label)
  Gray box: "파일 저장소" / "JSON 원본"
  Arrow labeled "분석결과" pointing to these

IMPORTANT: 
- Bidirectional arrows between User and Frontend
- Bidirectional arrows between Frontend and API Server (labeled "영상 업로드" going right, "리포트 반환" going left)
- NO TITLE at top
- Clean white background`;

// 관리자 버전 프롬프트
const adminPrompt = `Generate a clean system architecture diagram image.

Style: Professional, minimalist, white background
- Person icon: dark silhouette (head and shoulders, NOT stick figure)
- Dashed border boxes for grouping
- Dark boxes with white text for servers
- Light blue boxes for AI services

LAYOUT:

[LEFT] Dark silhouette person icon, label "사용자 (관리자)" below
  Arrow going RIGHT to Frontend →
  Arrow coming back LEFT from Frontend ←

[CENTER - dashed box "Frontend (UI)"]
  Box: "관리자 대시보드" / "Next.js + MUI"
  Subtitle: "통계/교사목록/비교"
  
  Arrow RIGHT labeled "통계 요청" →
  Arrow LEFT labeled "통계/리포트" ←
  (TWO SEPARATE ARROWS between Frontend and Backend)

[RIGHT - larger dashed box "API Server (Backend)"]
  Dark box: "API 서버" / "Next.js API Routes"
  Blue box: "OpenRouter" / "Gemini AI 종합평가"
  Database cylinder: "Supabase" / "reports, profiles 테이블"
  
  Arrows inside backend:
  - "데이터 조회" to Supabase
  - "교사별 데이터" from Supabase
  - "요약 요청" to OpenRouter
  - "AI 평가" from OpenRouter

IMPORTANT:
- MUST have arrows between User icon and Frontend (bidirectional)
- Bidirectional arrows between Frontend and Backend
- Include tech stack labels: Next.js, MUI, API Routes, Gemini
- DB labeled as "Supabase" (not just DB)
- NO TITLE at top
- Clean white background`;

async function generateImage(prompt, filename) {
  console.log(`🎨 Generating: ${filename}...\n`);
  
  const requestBody = JSON.stringify({
    model: 'google/gemini-3-pro-image-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ]
  });

  const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Teacher Analytics'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            console.log('❌ Error:', response.error.message);
            reject(new Error(response.error.message));
            return;
          }
          
          if (response.choices && response.choices[0]) {
            const message = response.choices[0].message;
            
            if (message.images && Array.isArray(message.images) && message.images.length > 0) {
              const img = message.images[0];
              
              if (img.image_url && img.image_url.url) {
                const url = img.image_url.url;
                
                if (url.startsWith('data:image')) {
                  const match = url.match(/data:image\/(png|jpeg|jpg|webp);base64,(.+)/);
                  if (match) {
                    const ext = match[1];
                    const base64Data = match[2];
                    const outputPath = path.join(__dirname, '..', 'public', `${filename}.${ext}`);
                    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
                    console.log(`✅ Saved: ${outputPath}\n`);
                    resolve(outputPath);
                    return;
                  }
                }
              }
            }
            
            console.log('⚠️ No image found in response');
            reject(new Error('No image in response'));
          }
        } catch (e) {
          console.error('Parse error:', e);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
      reject(e);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// 통합 버전 프롬프트
const integratedPrompt = `Generate a professional system architecture diagram showing BOTH teacher and admin user flows in ONE diagram.

Style: Professional, minimalist, white background, clean lines
- Person icons: dark silhouettes (head and shoulders, NOT stick figures)
- Dashed border boxes for grouping
- Dark boxes with white text for servers
- Light blue boxes for AI services
- Gray boxes for utilities

LAYOUT:

[LEFT SIDE - Two Users vertically arranged]
TOP user: Silhouette icon labeled "교사"
BOTTOM user: Silhouette icon labeled "관리자"

[CENTER - dashed box labeled "Frontend (UI)"]
Two boxes inside:
- "교사용 대시보드" / "Next.js" (for teacher)
- "관리자 대시보드" / "Next.js + MUI" (for admin)

[RIGHT - larger dashed box labeled "API Server (Backend)"]
- Dark box: "API 서버" / "Next.js API Routes"
- Gray box: "FFmpeg" / "오디오 추출"
- Blue box: "AssemblyAI" / "전사 + 화자구분"
- Blue box: "OpenRouter" / "Gemini 분석/평가"

[BOTTOM - Storage]
- Database cylinder: "Supabase" / "reports, profiles"
- Gray box: "파일 저장소" / "JSON 원본"

ARROW DIRECTIONS (MUST FOLLOW EXACTLY):

Teacher flow (top):
- 교사 icon → 교사용 대시보드 (arrow pointing right)
- 교사용 대시보드 → API 서버: arrow pointing RIGHT with label "영상 업로드"
- API 서버 → 교사용 대시보드: arrow pointing LEFT with label "리포트 반환"

Admin flow (bottom) - VERY IMPORTANT:
- 관리자 icon → 관리자 대시보드 (arrow pointing right)
- Draw an arrow that STARTS from 관리자 대시보드 box and ENDS at API 서버 box (arrow head touches API 서버), labeled "통계 요청"
- Draw an arrow that STARTS from API 서버 box and ENDS at 관리자 대시보드 box (arrow head touches 관리자 대시보드), labeled "통계/AI평가"

*** CRITICAL: The arrow labeled "통계 요청" must have its ARROW HEAD pointing AT and TOUCHING the API 서버 box ***
*** The arrow must visually CONNECT the two boxes with the arrowhead on the API 서버 side ***

Backend internal flow:
- API서버 → FFmpeg → AssemblyAI → OpenRouter (sequential arrows)
- Arrow from API서버 down to Supabase labeled "데이터 저장"
- Arrow from API서버 down to 파일 저장소 labeled "JSON 저장"

Storage connections (IMPORTANT - must have arrows):
- Supabase: arrow FROM API서버 TO Supabase (for saving)
- 파일 저장소: arrow FROM API서버 TO 파일 저장소 labeled "분석결과 저장"
- Both storage boxes must be CONNECTED to the system with visible arrows, NOT isolated

CRITICAL RULES:
1. 관리자 대시보드 → API 서버: arrow with head TOUCHING API 서버, labeled "통계 요청"
2. API 서버 → 관리자 대시보드: arrow with head TOUCHING 관리자 대시보드, labeled "통계/AI평가"
3. 교사용 대시보드 → API 서버: arrow labeled "영상 업로드"
4. API 서버 → 교사용 대시보드: arrow labeled "리포트 반환"
5. API 서버 → Supabase: arrow for data storage
6. API 서버 → 파일 저장소: arrow labeled "JSON 저장" (DO NOT leave 파일 저장소 disconnected!)
7. All arrow heads must clearly show direction and TOUCH the target boxes
8. NO TITLE at top
9. Clean white background`;

async function main() {
  console.log('📊 통합 시스템 구성도 생성 시작\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // 통합 버전 생성
    console.log('🔄 통합 버전 (교사 + 관리자 시스템)\n');
    await generateImage(integratedPrompt, 'diagram-integrated-system');
    
    console.log('=' .repeat(50));
    console.log('\n🎉 통합 다이어그램 생성 완료!\n');
    console.log('📁 저장 위치:');
    console.log('   - public/diagram-integrated-system.png');
    
  } catch (err) {
    console.error('❌ 생성 실패:', err.message);
  }
}

main();
