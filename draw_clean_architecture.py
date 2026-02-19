import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, ConnectionPatch
import matplotlib.patheffects as path_effects
import numpy as np

# 한글 폰트 설정
plt.rcParams['font.family'] = 'AppleGothic'
plt.rcParams['axes.unicode_minus'] = False

def draw_architecture():
    fig, ax = plt.subplots(figsize=(14, 18))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 18)
    ax.axis('off')
    ax.set_facecolor('white')
    fig.patch.set_facecolor('white')
    
    # 색상
    BLUE = '#3B82F6'
    LIGHT_BLUE = '#DBEAFE'
    DARK_BLUE = '#1E40AF'
    GRAY = '#6B7280'
    WHITE = '#FFFFFF'
    
    def draw_box(x, y, w, h, text, color=BLUE, text_color=WHITE, fontsize=11, bold=True):
        box = FancyBboxPatch((x, y), w, h,
                             boxstyle="round,pad=0.02,rounding_size=0.15",
                             facecolor=color, edgecolor=color,
                             linewidth=0)
        ax.add_patch(box)
        weight = 'bold' if bold else 'normal'
        ax.text(x + w/2, y + h/2, text, ha='center', va='center',
                fontsize=fontsize, fontweight=weight, color=text_color)
    
    def draw_arrow(x1, y1, x2, y2, style='->'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                   arrowprops=dict(arrowstyle=style, color=GRAY, lw=1.5,
                                  connectionstyle='arc3,rad=0'))
    
    def draw_label(x, y, text):
        ax.text(x, y, text, ha='right', va='center', fontsize=10, 
                color=GRAY, fontweight='bold')
    
    # ========== 입력 계층 ==========
    y = 16.5
    draw_label(1.8, y + 0.35, '입력 계층')
    draw_box(3, y, 3.5, 0.7, '🎥  영상 스트림')
    draw_box(7.5, y, 3.5, 0.7, '🎤  음향 스트림')
    
    draw_arrow(4.75, y, 4.75, y - 0.6)
    draw_arrow(9.25, y, 9.25, y - 0.6)
    
    # ========== 인코더 계층 ==========
    y = 14.8
    draw_label(1.8, y + 0.4, '인코더 계층')
    draw_box(2.5, y, 4, 0.8, '영상 인코더\n(Transformer + LoRA)', fontsize=9)
    draw_box(7.5, y, 4, 0.8, '음향 인코더\n(Transformer + LoRA)', fontsize=9)
    
    draw_arrow(4.5, y, 6, y - 0.8)
    draw_arrow(9.5, y, 8, y - 0.8)
    
    # ========== 융합 계층 ==========
    y = 13
    draw_label(1.8, y + 0.35, '융합 계층')
    draw_box(4, y, 6, 0.7, '멀티모달 융합 모듈')
    
    draw_arrow(7, y, 7, y - 0.6)
    
    # ========== 분류 계층 ==========
    y = 9.8
    draw_label(1.8, y + 1.2, '분류 계층')
    
    # 외곽 박스
    outer = FancyBboxPatch((2.5, y - 0.3), 9, 2.7,
                           boxstyle="round,pad=0.02,rounding_size=0.2",
                           facecolor=LIGHT_BLUE, edgecolor=BLUE, linewidth=2)
    ax.add_patch(outer)
    
    ax.text(7, y + 2.1, '관객 반응 분류기', ha='center', va='center',
            fontsize=12, fontweight='bold', color=DARK_BLUE)
    
    # 반응 유형 그리드
    reactions = ['환호', '박수', '야유', '질문', '침묵',
                 '웃음', '탄성', '휘파람', '기립박수', '퇴장']
    icons = ['🙌', '👏', '👎', '❓', '🤫', '😂', '😮', '🎵', '🙆', '🚪']
    
    for i, (reaction, icon) in enumerate(zip(reactions, icons)):
        col = i % 5
        row = i // 5
        rx = 3 + col * 1.7
        ry = y + 1.3 - row * 0.9
        
        small_box = FancyBboxPatch((rx, ry), 1.5, 0.7,
                                   boxstyle="round,pad=0.01,rounding_size=0.1",
                                   facecolor=BLUE, edgecolor=BLUE, linewidth=0)
        ax.add_patch(small_box)
        ax.text(rx + 0.75, ry + 0.35, f'{icon}\n{reaction}', ha='center', va='center',
                fontsize=8, color=WHITE, fontweight='bold')
    
    # 강도 스케일
    ax.text(3.5, y, '낮음', ha='center', va='center', fontsize=8, color=GRAY)
    ax.text(7, y, '중간', ha='center', va='center', fontsize=8, color=GRAY)
    ax.text(10.5, y, '높음', ha='center', va='center', fontsize=8, color=GRAY)
    ax.plot([3.5, 10.5], [y - 0.15, y - 0.15], color=GRAY, lw=1)
    
    draw_arrow(7, y - 0.5, 7, y - 1.1)
    
    # ========== 처리 계층 ==========
    y = 7.2
    draw_label(1.8, y + 0.35, '처리 계층')
    draw_box(2.5, y, 3, 0.7, '메타데이터 DB', fontsize=9)
    draw_box(5.7, y, 3, 0.7, '행동 규칙 엔진', fontsize=9)
    draw_box(8.9, y, 3, 0.7, 'VAII 계산기', fontsize=9)
    
    # 연결 화살표
    ax.annotate('', xy=(5.7, y + 0.35), xytext=(5.5, y + 0.35),
               arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.5))
    ax.annotate('', xy=(8.9, y + 0.35), xytext=(8.7, y + 0.35),
               arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.5))
    
    draw_arrow(7, y, 7, y - 0.6)
    
    # ========== 출력 계층 ==========
    y = 5.5
    draw_label(1.8, y + 0.35, '출력 계층')
    draw_box(3.5, y, 7, 0.7, '가상 아티스트 응답 생성기')
    
    # 출력 3개
    draw_arrow(5, y, 5, y - 0.6)
    draw_arrow(7, y, 7, y - 0.6)
    draw_arrow(9, y, 9, y - 0.6)
    
    y = 4
    draw_box(4, y, 2, 0.6, '행동', fontsize=10)
    draw_box(6.25, y, 2, 0.6, '표정', fontsize=10)
    draw_box(8.5, y, 2, 0.6, '동작', fontsize=10)
    
    draw_arrow(7, y, 7, y - 0.6)
    
    # ========== 아바타 ==========
    y = 2.5
    draw_box(4, y, 6, 0.7, '🎭  가상 아티스트 아바타')
    
    # 피드백 루프
    ax.annotate('', xy=(12, 16.85), xytext=(12, y + 0.35),
               arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.5,
                              connectionstyle='arc3,rad=0'))
    ax.plot([10, 12], [y + 0.35, y + 0.35], color=GRAY, lw=1.5)
    ax.plot([12, 12], [y + 0.35, 16.85], color=GRAY, lw=1.5)
    ax.plot([10.5, 12], [16.85, 16.85], color=GRAY, lw=1.5)
    ax.text(12.3, 9.5, '피드백', ha='left', va='center', fontsize=9, 
            color=GRAY, rotation=90)
    
    # ========== 성능 지표 ==========
    metrics_box = FancyBboxPatch((10, 0.5), 3.5, 2,
                                  boxstyle="round,pad=0.02,rounding_size=0.15",
                                  facecolor='#F0F9FF', edgecolor=BLUE, linewidth=1.5)
    ax.add_patch(metrics_box)
    
    ax.text(11.75, 2.2, '성능 지표', ha='center', va='center',
            fontsize=10, fontweight='bold', color=DARK_BLUE)
    
    metrics = [
        '✓ 분류 정확도: 90%+',
        '✓ 매핑 정확도: 90%+', 
        '✓ 지연시간: <500ms',
        '✓ 만족도: 90%+'
    ]
    
    for i, m in enumerate(metrics):
        ax.text(10.3, 1.85 - i * 0.35, m, ha='left', va='center',
                fontsize=8, color=DARK_BLUE)
    
    plt.tight_layout()
    plt.savefig('시스템_아키텍처_최종.png', dpi=200, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.savefig('시스템_아키텍처_최종.pdf', bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print('✅ 저장 완료!')
    print('   - 시스템_아키텍처_최종.png')
    print('   - 시스템_아키텍처_최종.pdf')
    plt.close()

if __name__ == "__main__":
    draw_architecture()
