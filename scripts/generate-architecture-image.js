const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

async function generateArchitectureImage() {
  const prompt = `Create a professional technical architecture diagram showing the evolution from RAG + LLM to Agent architecture.

LAYOUT: Side by side comparison, LEFT is "현재 구조" (Current), RIGHT is "확장 구조" (Extended)
STYLE: Clean, minimal, black and white with subtle gray shading, professional technical diagram style
LANGUAGE: All labels in Korean

LEFT SIDE - "현재 구조 (RAG + GPT OSS 20B)":
- Top: User icon with label "사용자 질의"
- Arrow down to box "RAG Pipeline" (문서 검색)
- Side connection to cylinder "Vector DB"
- Arrow down to box "GPT OSS 20B" (오픈소스 LLM)
- Arrow down to "응답 생성"

CENTER: Large arrow pointing right with text "확장" (Extension)

RIGHT SIDE - "확장 구조 (Agent Architecture)":
- Top: User icon with label "사용자 질의"
- Arrow down to large dashed border box labeled "Agent Controller" containing:
  - "Planning Module" (작업 분해)
  - "GPT OSS 20B" (추론 엔진)
  - "Memory" (기억 관리)
  - Circular arrow indicating iteration loop
- Bidirectional arrows connecting to "Tools" section below containing grid:
  - RAG 검색
  - 웹 검색  
  - 코드 실행
  - API 호출
- Arrow down to "최종 응답"

IMPORTANT:
- Use clean rectangular boxes with rounded corners
- Use cylinder shape for databases
- Use dashed border for the Agent Controller container
- Include small icons where appropriate (user, search, code, etc.)
- Make it suitable for academic/research paper
- Resolution: 1200x800 pixels
- White background`;

  console.log('Generating RAG → Agent architecture diagram...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Architecture Diagram Generator'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp-image-generation:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('Response received');

    // Extract image from response
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message;
      
      // Check for inline_data in content array
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'image_url' && item.image_url && item.image_url.url) {
            const base64Data = item.image_url.url.replace(/^data:image\/\w+;base64,/, '');
            const outputPath = path.join(__dirname, '..', 'public', 'architecture-rag-to-agent.png');
            fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
            console.log(`✅ Image saved: ${outputPath}`);
            return;
          }
        }
      }

      // Check for images array
      if (message.images && message.images.length > 0) {
        const base64Data = message.images[0];
        const outputPath = path.join(__dirname, '..', 'public', 'architecture-rag-to-agent.png');
        fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
        console.log(`✅ Image saved: ${outputPath}`);
        return;
      }

      console.log('No image found in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

generateArchitectureImage();
