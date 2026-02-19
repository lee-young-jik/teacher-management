const https = require('https');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = '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';

const prompt = `Create a professional system architecture diagram for a "Teacher Lesson Analysis System" for an academic paper. 

Requirements:
- Black and white style suitable for research papers
- Clean, professional look with clear labels in Korean

The diagram should show:
1. Left side: User icon labeled "사용자 (교사)" (User/Teacher)
2. Middle: Frontend box labeled "Frontend (Next.js)" inside a dotted border group labeled "Frontend (UI)"
3. Right side: Backend group (dotted border labeled "API Server (Backend)") containing:
   - "API 서버 (Next.js Routes)" box at top
   - "FFmpeg (오디오 추출)" box below
   - "AssemblyAI (전사 + 화자구분)" box 
   - "OpenRouter (Gemini 분석)" box
4. Bottom: Database cylinder icon labeled "DB (Supabase)" and "파일 저장소 (JSON 원본)" box

Arrows connecting:
- User → Frontend: "영상 업로드"
- Frontend → API Server: bidirectional arrows
- API Server → FFmpeg → AssemblyAI → OpenRouter
- Results going to DB and File Storage
- Frontend ← results back to user: "리포트 반환"

At the bottom, add text: "클라이언트 - 서버 - 클라우드 (AI) 구조"

Style: Minimalist, black and white, suitable for academic publication. Use boxes with borders, dotted group boxes, and clear Korean labels.`;

async function generateDiagram() {
  const requestBody = JSON.stringify({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 4096
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
          console.log('Response:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (e) {
          console.error('Parse error:', e);
          console.log('Raw response:', data);
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

// 이미지 생성 모델 사용
async function generateImageWithGemini() {
  console.log('Gemini 이미지 생성 모델로 시스템 구성도 생성 중...\n');
  
  const requestBody = JSON.stringify({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are an expert diagram creator. Generate a detailed Mermaid diagram code for a system architecture.

Create a Mermaid flowchart for "교사용 수업 분석 시스템 구성도" (Teacher Lesson Analysis System Architecture):

Requirements:
- Use subgraphs for grouping: "Frontend (UI)", "API Server (Backend)"
- Include: User (사용자/교사), Frontend (Next.js), API 서버, FFmpeg, AssemblyAI, OpenRouter, DB (Supabase), 파일 저장소
- Show data flow with labeled arrows: 영상 업로드, 오디오 추출, 전사, 분석결과, 리포트 반환
- Style: Clean and professional

Output ONLY the Mermaid code, nothing else.`
          }
        ]
      }
    ],
    max_tokens: 2048
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
          if (response.choices && response.choices[0]) {
            const mermaidCode = response.choices[0].message.content;
            console.log('Generated Mermaid Code:\n');
            console.log(mermaidCode);
            
            // HTML 파일로 저장
            const htmlContent = createMermaidHtml(mermaidCode);
            const outputPath = path.join(__dirname, '..', 'public', 'system-diagram-mermaid.html');
            fs.writeFileSync(outputPath, htmlContent);
            console.log('\n✅ Saved to:', outputPath);
            
            resolve(mermaidCode);
          } else {
            console.log('Unexpected response:', JSON.stringify(response, null, 2));
            reject(new Error('No content in response'));
          }
        } catch (e) {
          console.error('Parse error:', e);
          console.log('Raw response:', data);
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

function createMermaidHtml(mermaidCode) {
  // Clean up the mermaid code
  let cleanCode = mermaidCode;
  if (cleanCode.includes('```mermaid')) {
    cleanCode = cleanCode.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '');
  }
  if (cleanCode.includes('```')) {
    cleanCode = cleanCode.replace(/```\n?/g, '');
  }
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>시스템 구성도 (Mermaid)</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      background: white;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      font-size: 18pt;
      margin-bottom: 30px;
      color: #333;
    }
    .mermaid {
      background: white;
      padding: 20px;
    }
    .caption {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #333;
      font-weight: bold;
      font-size: 14pt;
    }
  </style>
</head>
<body>
  <h1>(a) 교사용 수업 분석 시스템 구성도</h1>
  
  <div class="mermaid">
${cleanCode}
  </div>
  
  <div class="caption">클라이언트 – 서버 – 클라우드 (AI) 구조</div>
  
  <script>
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#fff',
        primaryBorderColor: '#333',
        primaryTextColor: '#333',
        lineColor: '#333',
        secondaryColor: '#f5f5f5',
        tertiaryColor: '#e8e8e8'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  </script>
</body>
</html>`;
}

// Run
generateImageWithGemini().catch(console.error);
