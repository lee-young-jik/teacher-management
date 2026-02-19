import requests
import json
import base64

OPENROUTER_API_KEY = "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"

def generate_korean_diagram():
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Architecture Generator"
    }
    
    prompt = """시스템 아키텍처 다이어그램을 생성해주세요. 제목 없이, 모든 텍스트는 한글로 작성.

깔끔하고 현대적인 플로우차트 스타일로 다음 구성요소들을 위에서 아래로 배치:

[입력 계층]
- 영상 스트림 (카메라 아이콘)
- 음향 스트림 (마이크 아이콘)
화살표로 아래로 연결

[인코더 계층]
- 영상 인코더 (트랜스포머 + LoRA)
- 음향 인코더 (트랜스포머 + LoRA)
중앙에 멀티모달 융합 모듈

[분류 계층]
관객 반응 분류기 박스:
10가지 반응 유형을 그리드로 표시: 환호, 박수, 야유, 질문, 침묵, 웃음, 탄성, 휘파람, 기립박수, 퇴장
강도 표시: 낮음 | 중간 | 높음
몰입도 점수 막대

[처리 계층]
세 박스 연결:
- 메타데이터 DB (반응-행동 매핑)
- 행동 규칙 엔진 (후보군, 전이규칙, 우선순위)
- VAII 계산기 (적합성, 지연시간, 연속성 점수)

[출력 계층]
가상 아티스트 응답 생성기
세 가지 출력: 행동 | 표정 | 동작

[하단]
가상 아티스트 아바타
관객으로 피드백 루프 화살표

[성능 지표 박스]
✓ 분류 정확도: 90% 이상
✓ 매핑 정확도: 90% 이상
✓ 지연시간: 500ms 이하
✓ 만족도: 90% 이상

스타일:
- 현대적인 기술 다이어그램
- 파란색-보라색 그라데이션 컬러
- 깔끔한 흰색/밝은 배경
- 명확한 화살표로 데이터 흐름 표시
- 전문적인 발표 품질
- 둥근 사각형 컴포넌트
- 아이콘으로 시각적 명확성
- 모든 라벨은 한글로"""

    payload = {
        "model": "google/gemini-3-pro-image-preview",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    
    print("🎨 한글 아키텍처 다이어그램 생성 중...")
    
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=180
    )
    
    if response.status_code == 200:
        result = response.json()
        
        # Save full response
        with open("gemini_response_kr.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # Extract images
        for choice in result.get('choices', []):
            msg = choice.get('message', {})
            images = msg.get('images', [])
            
            print(f"✅ {len(images)}개 이미지 생성됨!")
            
            for i, img in enumerate(images):
                if isinstance(img, dict):
                    img_url = img.get('image_url', {})
                    url = img_url.get('url', '') if isinstance(img_url, dict) else img_url
                    
                    if url and url.startswith('data:image'):
                        header, b64_data = url.split(',', 1)
                        ext = 'jpeg' if 'jpeg' in header else 'png'
                        
                        img_bytes = base64.b64decode(b64_data)
                        filename = f'아키텍처_다이어그램_{i}.{ext}'
                        with open(filename, 'wb') as f:
                            f.write(img_bytes)
                        print(f"📁 저장됨: {filename} ({len(img_bytes):,} bytes)")
        
        return result
    else:
        print(f"❌ 오류: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    generate_korean_diagram()
