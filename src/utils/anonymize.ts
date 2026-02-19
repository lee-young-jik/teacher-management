// 선생님 이름 익명화 유틸리티

// 이름 -> 익명 이름 매핑을 저장
const nameMap = new Map<string, string>();
let counter = 0;

// 알파벳 배열
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * 실제 이름을 익명 이름으로 변환
 * @param realName 실제 이름
 * @returns 익명화된 이름 (예: "선생님 A", "선생님 B")
 */
export function anonymizeName(realName: string): string {
  if (!realName) return '알 수 없음';
  
  // 이미 매핑된 이름이 있으면 반환
  if (nameMap.has(realName)) {
    return nameMap.get(realName)!;
  }
  
  // 새로운 익명 이름 생성
  const index = nameMap.size;
  const anonymousName = index < alphabet.length 
    ? `선생님 ${alphabet[index]}` 
    : `선생님 ${index + 1}`;
  
  nameMap.set(realName, anonymousName);
  return anonymousName;
}

/**
 * 익명 이름의 이니셜 (아바타용)
 * @param realName 실제 이름
 * @returns 이니셜 (예: "A", "B")
 */
export function getAnonymousInitial(realName: string): string {
  const anonymousName = anonymizeName(realName);
  const match = anonymousName.match(/[A-Z]|\d+/);
  return match ? match[0] : '?';
}

/**
 * 매핑 초기화 (테스트용)
 */
export function resetNameMap(): void {
  nameMap.clear();
  counter = 0;
}

/**
 * 이름 목록을 받아서 일관된 순서로 익명화
 * @param names 이름 목록
 */
export function initializeNameMap(names: string[]): void {
  resetNameMap();
  names.forEach(name => anonymizeName(name));
}
