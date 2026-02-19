import requests
import json
import base64
from datetime import datetime
import os

# OpenRouter API 설정
OPENROUTER_API_KEY = "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"

def generate_architecture_image():
    """
    Gemini 3 Pro Image Preview 모델을 사용하여 시스템 아키텍처 이미지 생성
    """
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Architecture Generator"
    }
    
    # 이미지 생성 프롬프트 (한국어 + 영어 혼합)
    prompt = """Generate a professional system architecture diagram image.

Title: "Virtual Artist-Audience Interaction System" (가상 아티스트-관객 상호작용 시스템)

Create a clean, modern flowchart-style diagram with these components arranged vertically:

[TOP - INPUT LAYER]
📥 Two input boxes side by side:
- "🎥 Video Stream" (left)
- "🎤 Audio Stream" (right)
Arrow pointing down

[ENCODER LAYER]
🔄 Two encoder boxes with LoRA badge:
- "Video Encoder (Transformer + LoRA)"
- "Audio Encoder (Transformer + LoRA)"
Both connect to center fusion module:
- "⚡ Multimodal Fusion Module"

[CLASSIFICATION LAYER]
🎯 Large box "Audience Reaction Classifier" containing:
Grid of 10 reaction types: 환호, 박수, 야유, 질문, 침묵, 웃음, 탄성, 휘파람, 기립, 퇴장
Intensity meter: Low | Medium | High
Engagement score bar

[PROCESSING LAYER]
Three connected boxes:
- "📦 Metadata DB" (reaction-action mapping)
- "📋 Action Rule Engine" (candidates, transitions, priorities)
- "📈 VAII Calculator" (appropriateness, latency, continuity scores)

[OUTPUT LAYER]
🤖 "Virtual Artist Response Generator"
Three outputs: Behavior | Expression | Movement

[BOTTOM]
🎭 "Virtual Artist Avatar"
Feedback loop arrow back to Input Layer
👥 "Audience" at very bottom

[METRICS BOX]
Performance targets:
✓ Classification Accuracy: 90%+
✓ Mapping Accuracy: 90%+  
✓ Latency: <500ms
✓ Satisfaction: 90%+

STYLE REQUIREMENTS:
- Modern tech diagram aesthetic
- Blue-purple gradient color scheme
- Clean white/light background
- Clear directional arrows showing data flow
- Professional presentation quality
- Rounded rectangles for components
- Icons/emojis for visual clarity
- Korean and English labels"""

    payload = {
        "model": "google/gemini-3-pro-image-preview",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    print("🎨 Gemini 3 Pro Image Preview 모델로 아키텍처 다이어그램 생성 중...")
    print("-" * 70)
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=180
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # 응답 내용 확인
            if "choices" in result and len(result["choices"]) > 0:
                message = result["choices"][0]["message"]
                content = message.get("content", "")
                
                print("✅ 응답 받음!")
                print("-" * 70)
                
                # 이미지 데이터가 있는지 확인
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict):
                            if item.get("type") == "image_url":
                                image_url = item.get("image_url", {}).get("url", "")
                                if image_url.startswith("data:image"):
                                    # Base64 이미지 저장
                                    save_base64_image(image_url)
                                else:
                                    print(f"🖼️ 이미지 URL: {image_url}")
                            elif item.get("type") == "text":
                                print(item.get("text", ""))
                elif isinstance(content, str):
                    # base64 이미지가 포함되어 있는지 확인
                    if "data:image" in content:
                        save_base64_image(content)
                    else:
                        print(content[:3000] if len(content) > 3000 else content)
                
                # 전체 응답 저장
                with open("/Users/aglyj0225/Desktop/LYJ/teacher/gemini_response.json", "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print("\n📄 전체 응답이 저장되었습니다: gemini_response.json")
                
            return result
        else:
            print(f"❌ API 오류: {response.status_code}")
            error_text = response.text
            print(error_text)
            
            # 오류 내용 저장
            with open("/Users/aglyj0225/Desktop/LYJ/teacher/api_error.txt", "w", encoding="utf-8") as f:
                f.write(f"Status: {response.status_code}\n{error_text}")
            
            return None
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return None


def save_base64_image(data_url):
    """Base64 이미지 데이터를 파일로 저장"""
    try:
        # data:image/png;base64,xxxx 형식에서 base64 부분 추출
        if "base64," in data_url:
            base64_data = data_url.split("base64,")[1]
        else:
            base64_data = data_url
            
        img_bytes = base64.b64decode(base64_data)
        
        filename = f"architecture_diagram_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = f"/Users/aglyj0225/Desktop/LYJ/teacher/{filename}"
        
        with open(filepath, "wb") as f:
            f.write(img_bytes)
        
        print(f"✅ 이미지 저장됨: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"❌ 이미지 저장 실패: {e}")
        return None


if __name__ == "__main__":
    print("=" * 70)
    print("🎭 가상 아티스트-관객 상호작용 시스템 아키텍처 이미지 생성")
    print("   모델: google/gemini-3-pro-image-preview")
    print("=" * 70)
    
    generate_architecture_image()
