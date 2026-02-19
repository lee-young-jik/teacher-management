'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ko: {
    // 공통
    'dashboard': '대시보드',
    'logout': '로그아웃',
    'upload': '업로드',
    'save': '저장',
    'cancel': '취소',
    'edit': '수정',
    'delete': '삭제',
    'view': '보기',
    'loading': '로딩 중...',
    'error': '오류',

    // 브랜드
    'brand.teacherAnalytics': 'Teacher Analytics',
    'brand.tagline': 'AI 기반 수업 분석 플랫폼',
    
    // 선생님 대시보드
    'teacher.dashboard': '선생님 대시보드',
    'teacher.greeting': '안녕하세요',
    'teacher.welcomeMessage': '오늘도 멋진 수업을 진행해보세요',
    'teacher.uploadVideo': '수업 영상 업로드',
    'teacher.calendar': '수업 캘린더',
    'teacher.recentLessons': '최근 수업',
    'teacher.lessonTitle': '수업 제목',
    'teacher.score': '점수',
    'teacher.date': '날짜',
    'teacher.duration': '시간',
    'teacher.analysisComplete': '분석 완료',
    'teacher.averageScore': '평균 점수',
    'teacher.totalLessons': '총 수업',
    'teacher.viewReport': '보고서 보기',
    'teacher.editTitle': '제목 수정',
    'teacher.refresh': '새로고침',
    'teacher.grade': '종합 등급',
    'teacher.highest': '최고 점수',
    
    // 원장 대시보드
    'admin.dashboard': '원장 대시보드',
    'admin.greeting': '안녕하세요',
    'admin.welcomeMessage': '교사 통계와 리포트를 한눈에 확인해보세요',
    'admin.totalReports': '총 보고서',
    'admin.totalTeachers': '총 선생님',
    'admin.averageScore': '평균 점수',
    'admin.analysis': '종합 분석',
    'admin.teacherList': '선생님 목록',
    'admin.teacherCount': '명',
    'admin.reports': '보고서',
    'admin.reportsCount': '보고서',
    'admin.reportsUnit': '개',
    'admin.avgScoreLabel': '평균 점수',
    'admin.viewReports': '보고서 보기',
    'admin.keyStrengths': '주요 강점',
    'admin.areasForImprovement': '개선 필요 사항',
    'admin.mentionCount': '회 언급됨',
    'admin.classRecords': '수업 기록',
    'admin.classCount': '회',
    'admin.classTitle': '수업 제목',
    'admin.totalScore': '총점',
    'admin.studentParticipation': '학생참여',
    'admin.conceptExplanation': '개념설명',
    'admin.feedbackScore': '피드백',
    'admin.structure': '체계성',
    'admin.interactionScore': '상호작용',
    'admin.date': '날짜',
    'admin.details': '상세',
    'admin.teacher': '선생님',
    'admin.totalClasses': '총',
    'admin.classesCount': '회 수업',
    'admin.average': '평균',
    'admin.points': '점',
    'admin.trendStable': '안정적',
    'admin.trendImproving': '성장 중',
    'admin.trendDeclining': '하락 추세',
    'admin.firstClass': '첫 수업',
    'admin.recentClass': '최근 수업',
    'admin.aiAnalysisDescription': 'AI가 분석한 {name} 선생님의 수업 종합 평가',
    'admin.averageByCategory': '영역별 평균 점수',
    'admin.noReportsYet': '{name} 선생님의 보고서가 아직 없습니다.',
    'admin.backToDashboard': '대시보드로 돌아가기',
    'admin.generateAiSummary': 'AI 종합 분석 생성하기',
    'admin.regenerateAiSummary': '다시 분석하기',
    'admin.aiAnalysisStart': 'AI 분석 시작',
    'admin.retry': '다시 시도',
    'admin.aiSummaryDescription': '개의 수업 데이터를 분석하여 종합 평가를 생성합니다',
    'admin.clickToAnalyze': '클릭하면 AI가',
    'admin.comprehensiveEvaluation': '종합 평가 보고서',
    'admin.teacherEvaluation': '선생님 평가',
    
    // 보고서
    'report.overallScore': '종합 점수',
    'report.excellent': '탁월',
    'report.good': '우수',
    'report.satisfactory': '양호',
    'report.average': '보통',
    'report.needsImprovement': '개선 필요',
    'report.teacherSpeaking': '교사 발화 시간',
    'report.studentSpeaking': '학생 발화 시간',
    'report.interactions': '상호작용 횟수',
    'report.positiveFeedback': '긍정적 피드백',
    'report.detailedAnalysis': '상세 분석',
    'report.scoreBreakdown': '점수 분석',
    'report.back': '뒤로가기',
    'report.areaEvaluation': '영역별 평가 결과',
    
    // 평가 영역
    'category.studentParticipation': '학생 참여',
    'category.conceptExplanation': '개념 설명',
    'category.feedback': '피드백',
    'category.structure': '수업 체계',
    'category.interaction': '상호작용',
    'category.engagement': '참여도',
    'category.clarity': '명확성',
    'category.timeManagement': '시간관리',
    'category.feedbackQuality': '피드백 품질',
    
    // 카테고리 피드백
    'feedback.engagement': '학생들과의 상호작용이 활발했습니다.',
    'feedback.clarity': '설명이 명확하고 이해하기 쉬웠습니다.',
    'feedback.interaction': '적절한 질문과 피드백이 있었습니다.',
    'feedback.timeManagement': '시간 관리가 체계적이었습니다.',
    'feedback.feedbackQuality': '학생들에게 적절한 피드백을 제공했습니다.',
    
    // 통계
    'stats.highest': '최고 점수',
    'stats.lowest': '최저 점수',
    'stats.recent': '최근 점수',
    'stats.bestArea': '최고 영역',
    'stats.improvementArea': '개선 필요',
    'stats.totalLessons': '총 수업',
    'stats.averageScore': '평균 점수',
    
    // 차트
    'chart.areaEvaluation': '영역별 평가 결과',
    'chart.scoreTrend': '점수 변화 추이',
    'chart.comparison': '선생님 비교',
    
    // 기타
    'month': '월',
    'times': '회',
    'minutes': '분',
    'points': '점',
    'improving': '성장 중',
    'declining': '하락 추세',
    'stable': '안정적',
  },
  en: {
    // Common
    'dashboard': 'Dashboard',
    'logout': 'Logout',
    'upload': 'Upload',
    'save': 'Save',
    'cancel': 'Cancel',
    'edit': 'Edit',
    'delete': 'Delete',
    'view': 'View',
    'loading': 'Loading...',
    'error': 'Error',

    // Brand
    'brand.teacherAnalytics': 'Teacher Analytics',
    'brand.tagline': 'AI LESSON ANALYTICS PLATFORM',
    
    // Teacher Dashboard
    'teacher.dashboard': 'Dashboard',
    'teacher.greeting': 'Hello',
    'teacher.welcomeMessage': 'Have a great lesson today',
    'teacher.uploadVideo': 'Upload Video',
    'teacher.calendar': 'Calendar',
    'teacher.recentLessons': 'Recent',
    'teacher.lessonTitle': 'Title',
    'teacher.score': 'Score',
    'teacher.date': 'Date',
    'teacher.duration': 'Time',
    'teacher.analysisComplete': 'Analyzed',
    'teacher.averageScore': 'Avg Score',
    'teacher.totalLessons': 'Lessons',
    'teacher.viewReport': 'View',
    'teacher.editTitle': 'Edit',
    'teacher.refresh': 'Refresh',
    'teacher.grade': 'Grade',
    'teacher.highest': 'Highest',
    
    // Admin Dashboard
    'admin.dashboard': 'Dashboard',
    'admin.greeting': 'Hello',
    'admin.welcomeMessage': 'Review teacher stats and reports at a glance',
    'admin.totalReports': 'Reports',
    'admin.totalTeachers': 'Teachers',
    'admin.averageScore': 'Avg Score',
    'admin.analysis': 'Analysis',
    'admin.teacherList': 'Teacher List',
    'admin.teacherCount': ' Teachers',
    'admin.reports': 'Reports',
    'admin.reportsCount': 'Reports',
    'admin.reportsUnit': '',
    'admin.avgScoreLabel': 'Average Score',
    'admin.viewReports': 'View Reports',
    'admin.keyStrengths': 'Key Strengths',
    'admin.areasForImprovement': 'Areas for Improvement',
    'admin.mentionCount': ' mentioned',
    'admin.classRecords': 'Class Records',
    'admin.classCount': ' times',
    'admin.classTitle': 'Class Title',
    'admin.totalScore': 'Total',
    'admin.studentParticipation': 'Student Participation',
    'admin.conceptExplanation': 'Concept Explanation',
    'admin.feedbackScore': 'Feedback',
    'admin.structure': 'Structure',
    'admin.interactionScore': 'Interaction',
    'admin.date': 'Date',
    'admin.details': 'Details',
    'admin.teacher': ' Teacher',
    'admin.totalClasses': 'Total',
    'admin.classesCount': ' Classes',
    'admin.average': 'Average',
    'admin.points': '',
    'admin.trendStable': 'Stable',
    'admin.trendImproving': 'Improving',
    'admin.trendDeclining': 'Declining',
    'admin.firstClass': 'First Class',
    'admin.recentClass': 'Recent Class',
    'admin.aiAnalysisDescription': 'Comprehensive class evaluation of {name} analyzed by AI',
    'admin.averageByCategory': 'Average Score by Category',
    'admin.noReportsYet': 'No reports yet for {name}.',
    'admin.backToDashboard': 'Back to Dashboard',
    'admin.generateAiSummary': 'Generate AI Summary',
    'admin.regenerateAiSummary': 'Regenerate',
    'admin.aiAnalysisStart': 'Start AI Analysis',
    'admin.retry': 'Retry',
    'admin.aiSummaryDescription': 'lessons to generate evaluation',
    'admin.clickToAnalyze': 'AI will analyze',
    'admin.comprehensiveEvaluation': 'Comprehensive Evaluation',
    'admin.teacherEvaluation': 'Teacher Evaluation',
    
    // Report
    'report.overallScore': 'Overall',
    'report.excellent': 'Excellent',
    'report.good': 'Good',
    'report.satisfactory': 'Fair',
    'report.average': 'Average',
    'report.needsImprovement': 'Needs Work',
    'report.teacherSpeaking': 'Teacher Time',
    'report.studentSpeaking': 'Student Time',
    'report.interactions': 'Interactions',
    'report.positiveFeedback': 'Positive',
    'report.detailedAnalysis': 'Analysis',
    'report.scoreBreakdown': 'Scores',
    'report.back': 'Back',
    'report.areaEvaluation': 'Evaluation',
    
    // Categories
    'category.studentParticipation': 'Participation',
    'category.conceptExplanation': 'Explanation',
    'category.feedback': 'Feedback',
    'category.structure': 'Structure',
    'category.interaction': 'Interaction',
    'category.engagement': 'Engagement',
    'category.clarity': 'Clarity',
    'category.timeManagement': 'Time Mgmt',
    'category.feedbackQuality': 'Feedback',
    
    // Category Feedback
    'feedback.engagement': 'Active interaction with students.',
    'feedback.clarity': 'Clear and easy to understand explanations.',
    'feedback.interaction': 'Appropriate questions and feedback.',
    'feedback.timeManagement': 'Systematic time management.',
    'feedback.feedbackQuality': 'Provided appropriate feedback to students.',
    
    // Statistics
    'stats.highest': 'Highest',
    'stats.lowest': 'Lowest',
    'stats.recent': 'Recent',
    'stats.bestArea': 'Best Area',
    'stats.improvementArea': 'Needs Work',
    'stats.totalLessons': 'Lessons',
    'stats.averageScore': 'Avg Score',
    
    // Charts
    'chart.areaEvaluation': 'Evaluation',
    'chart.scoreTrend': 'Score Trend',
    'chart.comparison': 'Comparison',
    
    // Others
    'month': 'Month',
    'times': 'times',
    'minutes': 'min',
    'points': 'pts',
    'improving': 'Improving',
    'declining': 'Declining',
    'stable': 'Stable',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    // localStorage에서 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ko']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
