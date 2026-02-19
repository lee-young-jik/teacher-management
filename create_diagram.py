import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# 한글 폰트 설정
plt.rcParams['font.family'] = ['AppleGothic', 'Malgun Gothic', 'NanumGothic', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

def create_architecture_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(16, 20))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 20)
    ax.axis('off')
    
    # 색상 정의
    colors = {
        'input': '#4A90D9',      # 파란색
        'encoder': '#6B5B95',    # 보라색
        'fusion': '#88B04B',     # 초록색
        'classifier': '#F7CAC9', # 분홍색
        'metadata': '#92A8D1',   # 연파랑
        'vaii': '#955251',       # 와인색
        'output': '#B565A7',     # 자주색
        'avatar': '#009B77',     # 청록색
        'metric': '#DD4124',     # 주황색
        'arrow': '#5B5EA6'       # 화살표색
    }
    
    # 박스 그리기 함수
    def draw_box(x, y, w, h, color, text, fontsize=11, alpha=0.8):
        box = FancyBboxPatch((x, y), w, h, 
                             boxstyle="round,pad=0.02,rounding_size=0.3",
                             facecolor=color, edgecolor='#333333', 
                             linewidth=2, alpha=alpha)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2, text, ha='center', va='center', 
                fontsize=fontsize, fontweight='bold', color='#1a1a1a',
                wrap=True)
    
    # 화살표 그리기 함수
    def draw_arrow(x1, y1, x2, y2):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                   arrowprops=dict(arrowstyle='->', color=colors['arrow'], lw=2))
    
    y_pos = 18.5
    
    # ===== 입력 계층 =====
    draw_box(3, y_pos, 4, 1, colors['input'], '🎥 영상 스트림')
    draw_box(9, y_pos, 4, 1, colors['input'], '🎤 음향 스트림')
    
    # 화살표
    draw_arrow(5, y_pos, 5, y_pos - 0.8)
    draw_arrow(11, y_pos, 11, y_pos - 0.8)
    
    y_pos -= 2.2
    
    # ===== 인코더 계층 =====
    draw_box(2, y_pos, 5, 1.2, colors['encoder'], '영상 인코더\n(트랜스포머 + LoRA)', fontsize=10)
    draw_box(9, y_pos, 5, 1.2, colors['encoder'], '음향 인코더\n(트랜스포머 + LoRA)', fontsize=10)
    
    # 화살표
    draw_arrow(4.5, y_pos, 6.5, y_pos - 1.5)
    draw_arrow(11.5, y_pos, 9.5, y_pos - 1.5)
    
    y_pos -= 2.5
    
    # ===== 융합 모듈 =====
    draw_box(5.5, y_pos, 5, 1.2, colors['fusion'], '⚡ 멀티모달 융합 모듈', fontsize=11)
    
    draw_arrow(8, y_pos, 8, y_pos - 0.8)
    
    y_pos -= 2.2
    
    # ===== 관객 반응 분류기 =====
    # 메인 박스
    classifier_box = FancyBboxPatch((2, y_pos - 2.8), 12, 4, 
                                     boxstyle="round,pad=0.02,rounding_size=0.3",
                                     facecolor=colors['classifier'], edgecolor='#333333', 
                                     linewidth=2, alpha=0.6)
    ax.add_patch(classifier_box)
    ax.text(8, y_pos + 0.7, '🎯 관객 반응 분류기', ha='center', va='center', 
            fontsize=13, fontweight='bold')
    
    # 반응 유형 그리드 (2줄 x 5열)
    reactions = ['환호', '박수', '야유', '질문', '침묵', 
                 '웃음', '탄성', '휘파람', '기립박수', '퇴장']
    
    for i, reaction in enumerate(reactions):
        col = i % 5
        row = i // 5
        rx = 2.5 + col * 2.3
        ry = y_pos - 0.5 - row * 1.0
        small_box = FancyBboxPatch((rx, ry), 2, 0.7, 
                                    boxstyle="round,pad=0.01,rounding_size=0.1",
                                    facecolor='white', edgecolor='#666666', 
                                    linewidth=1, alpha=0.9)
        ax.add_patch(small_box)
        ax.text(rx + 1, ry + 0.35, reaction, ha='center', va='center', fontsize=9)
    
    # 강도 표시
    ax.text(4, y_pos - 2.3, '강도:  낮음 ◀━━━━━▶ 높음', ha='left', va='center', fontsize=9)
    ax.text(10, y_pos - 2.3, '몰입도: ████████░░', ha='left', va='center', fontsize=9)
    
    y_pos -= 4.5
    
    draw_arrow(8, y_pos + 0.8, 8, y_pos + 0.2)
    
    # ===== 처리 계층 (3개 박스) =====
    draw_box(1, y_pos - 1.5, 4, 1.5, colors['metadata'], 
             '📦 메타데이터 DB\n(반응-행동 매핑)', fontsize=9)
    draw_box(6, y_pos - 1.5, 4, 1.5, colors['metadata'], 
             '📋 행동 규칙 엔진\n(후보군, 전이규칙)', fontsize=9)
    draw_box(11, y_pos - 1.5, 4, 1.5, colors['vaii'], 
             '📈 VAII 계산기\n(적합성, 지연, 연속성)', fontsize=9)
    
    # 연결 화살표
    draw_arrow(5, y_pos - 0.75, 6, y_pos - 0.75)
    draw_arrow(10, y_pos - 0.75, 11, y_pos - 0.75)
    
    y_pos -= 3
    
    draw_arrow(8, y_pos + 0.3, 8, y_pos - 0.3)
    
    # ===== 출력 계층 =====
    draw_box(4, y_pos - 1.3, 8, 1.3, colors['output'], 
             '🤖 가상 아티스트 응답 생성기', fontsize=12)
    
    y_pos -= 2.8
    
    # 3개 출력
    draw_box(3, y_pos, 3, 0.9, '#DDA0DD', '행동', fontsize=10)
    draw_box(6.5, y_pos, 3, 0.9, '#DDA0DD', '표정', fontsize=10)
    draw_box(10, y_pos, 3, 0.9, '#DDA0DD', '동작', fontsize=10)
    
    draw_arrow(8, y_pos, 8, y_pos - 0.6)
    
    y_pos -= 1.8
    
    # ===== 가상 아티스트 아바타 =====
    draw_box(5, y_pos, 6, 1.2, colors['avatar'], '🎭 가상 아티스트 아바타', fontsize=12)
    
    # 피드백 루프 (곡선 화살표)
    ax.annotate('', xy=(1.5, 18), xytext=(1.5, y_pos + 0.6),
               arrowprops=dict(arrowstyle='->', color='#888888', lw=1.5,
                              connectionstyle='arc3,rad=0.3'))
    ax.text(0.5, 10, '피\n드\n백\n루\n프', ha='center', va='center', 
            fontsize=8, color='#666666')
    
    y_pos -= 2
    
    # ===== 성능 지표 박스 =====
    metric_box = FancyBboxPatch((10.5, y_pos), 5, 2.5, 
                                 boxstyle="round,pad=0.02,rounding_size=0.2",
                                 facecolor='#FFF8DC', edgecolor=colors['metric'], 
                                 linewidth=2, alpha=0.9)
    ax.add_patch(metric_box)
    
    metrics = [
        '✓ 분류 정확도: 90% 이상',
        '✓ 매핑 정확도: 90% 이상',
        '✓ 지연시간: 500ms 이하',
        '✓ 만족도: 90% 이상'
    ]
    
    for i, metric in enumerate(metrics):
        ax.text(11, y_pos + 2.1 - i * 0.55, metric, ha='left', va='center', 
                fontsize=9, color='#333333')
    
    # 저장
    plt.tight_layout()
    plt.savefig('시스템_아키텍처.png', dpi=150, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('시스템_아키텍처.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    print('✅ 저장 완료: 시스템_아키텍처.png, 시스템_아키텍처.pdf')
    plt.close()

if __name__ == "__main__":
    create_architecture_diagram()
