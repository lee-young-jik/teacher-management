import requests
import json
import base64

OPENROUTER_API_KEY = "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"

def generate_pro_diagram():
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Architecture Generator"
    }
    
    # 영어로 프롬프트 작성 (AI 이미지 생성은 영어가 더 잘됨)
    prompt = """Create a highly professional, modern system architecture diagram for an AI-powered Virtual Artist-Audience Interaction System.

STYLE REQUIREMENTS:
- Ultra modern, sleek tech startup style
- Dark theme with neon blue (#00D4FF) and purple (#9B59B6) accents on dark background (#1a1a2e)
- Glassmorphism effect on boxes
- Glowing edges and subtle gradients
- Clean minimalist icons (no text labels, use icons only)
- Smooth connecting lines with animated flow feel
- Professional presentation quality like Apple keynote

LAYOUT (top to bottom flow):
1. TOP: Two input icons - Camera (video) and Microphone (audio) with data stream visual
2. DUAL ENCODERS: Two neural network visualizations side by side
3. CENTER: Fusion module with merging streams visualization  
4. CLASSIFIER: Grid of 10 emotion/reaction icons (applause, cheer, boo, question, silence, laugh, exclaim, whistle, standing ovation, exit)
5. PROCESSING: Three connected modules - Database, Rule Engine, Calculator
6. OUTPUT: Response generator with behavior/expression/motion outputs
7. BOTTOM: Digital avatar silhouette with feedback loop arrow back to top

VISUAL ELEMENTS:
- Use icons instead of text
- Data flow particles along connection lines
- Subtle glow effects
- Depth and 3D feel
- Tech circuit patterns in background
- Performance metrics as circular progress indicators (90%+)

NO TEXT - only use universal icons and symbols. Make it look like a premium tech company's architecture visualization."""

    payload = {
        "model": "openai/gpt-5-image",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    print("🎨 GPT-5 Image로 프로페셔널 다이어그램 생성 중...")
    print("   (1-2분 소요될 수 있습니다)")
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=300
        )
        
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            with open("gpt5_response.json", "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            # Extract images
            for choice in result.get('choices', []):
                msg = choice.get('message', {})
                images = msg.get('images', [])
                
                if images:
                    print(f"✅ {len(images)}개 이미지 생성됨!")
                    
                    for i, img in enumerate(images):
                        if isinstance(img, dict):
                            img_url = img.get('image_url', {})
                            url = img_url.get('url', '') if isinstance(img_url, dict) else img_url
                            
                            if url and url.startswith('data:image'):
                                header, b64_data = url.split(',', 1)
                                ext = 'png' if 'png' in header else 'jpeg'
                                
                                img_bytes = base64.b64decode(b64_data)
                                filename = f'pro_architecture_{i}.{ext}'
                                with open(filename, 'wb') as f:
                                    f.write(img_bytes)
                                print(f"📁 저장됨: {filename} ({len(img_bytes):,} bytes)")
                else:
                    # Check content for image
                    content = msg.get('content', '')
                    if content:
                        print("텍스트 응답:", content[:500])
                        
            return result
        else:
            print(f"❌ 오류: {response.status_code}")
            print(response.text[:1000])
            return None
            
    except Exception as e:
        print(f"❌ 예외: {e}")
        return None


def try_gemini_flash():
    """Gemini 2.5 Flash Image (Nano Banana) 시도"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Architecture Generator"
    }
    
    prompt = """Create a stunning, futuristic system architecture diagram.

DESIGN:
- Dark navy/purple background (#0f0f23)
- Neon cyan (#00fff7) and magenta (#ff00ff) accent colors
- Glassmorphism boxes with blur effect
- Glowing connection lines
- Modern tech aesthetic like a sci-fi movie interface

STRUCTURE (vertical flow):
1. INPUT LAYER: Video camera icon + Audio microphone icon
2. ENCODER LAYER: Two brain/neural network icons side by side
3. FUSION: Central hexagon with merging arrows
4. CLASSIFIER: 2x5 grid of emotion icons (clap, cheer, boo, ?, silence, laugh, wow, whistle, stand, exit)
5. PROCESSING: 3 connected hexagons (database, gears, chart)
6. OUTPUT: Robot/avatar generator box
7. Three outputs: Person walking, Face, Body motion
8. AVATAR: Digital human silhouette at bottom

STYLE:
- NO TEXT, icons only
- Particle effects along data flow lines
- Circular progress rings showing 90%
- Holographic/transparent look
- Premium tech visualization quality"""

    payload = {
        "model": "google/gemini-2.5-flash-image",
        "messages": [{"role": "user", "content": prompt}]
    }
    
    print("\n🎨 Gemini 2.5 Flash Image (Nano Banana)로 시도 중...")
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            
            for choice in result.get('choices', []):
                msg = choice.get('message', {})
                images = msg.get('images', [])
                
                if images:
                    print(f"✅ {len(images)}개 이미지!")
                    for i, img in enumerate(images):
                        if isinstance(img, dict):
                            img_url = img.get('image_url', {})
                            url = img_url.get('url', '') if isinstance(img_url, dict) else img_url
                            
                            if url and url.startswith('data:image'):
                                header, b64_data = url.split(',', 1)
                                ext = 'png' if 'png' in header else 'jpeg'
                                img_bytes = base64.b64decode(b64_data)
                                filename = f'nano_banana_{i}.{ext}'
                                with open(filename, 'wb') as f:
                                    f.write(img_bytes)
                                print(f"📁 저장: {filename} ({len(img_bytes):,} bytes)")
            return result
        else:
            print(f"❌ 오류: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 예외: {e}")
        return None


if __name__ == "__main__":
    # GPT-5 Image 시도
    result1 = generate_pro_diagram()
    
    # Nano Banana 시도
    result2 = try_gemini_flash()
