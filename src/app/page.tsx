'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Pagination
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import UserHeader from '../../components/layout/UserHeader';
import { motion } from 'framer-motion';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { ko } from 'date-fns/locale';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import StarIcon from '@mui/icons-material/Star';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

// Styled Components
const PageBackground = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.25) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.25) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(240, 147, 251, 0.15) 0%, transparent 40%);
    pointer-events: none;
  }
`;

const StatCard = styled(motion.div)<{ gradient: string }>`
  background: ${props => props.gradient};
  border-radius: 20px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%
    );
    animation: ${shimmer} 3s infinite;
  }
`;

const GlassCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
`;

const LessonCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  }
`;

const UploadCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.6);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  }
`;

const FloatingIcon = styled(Box)`
  animation: ${float} 3s ease-in-out infinite;
`;

const PulseButton = styled(Button)`
  animation: ${pulse} 2s ease-in-out infinite;
`;

// 캘린더 스타일
const CalendarContainer = styled(Box)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
`;

const CalendarHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;

const CalendarGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const DayHeader = styled(Box)`
  text-align: center;
  padding: 12px 0;
  color: #666;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const DayCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$isCurrentMonth' && prop !== '$isToday'
})<{ $isCurrentMonth?: boolean; $isToday?: boolean }>`
  min-height: 90px;
  padding: 8px;
  border-radius: 8px;
  cursor: default;
  transition: all 0.2s ease;
  position: relative;
  background: ${props => props.$isToday ? 'rgba(102, 126, 234, 0.08)' : 'transparent'};
  border: 1px solid ${props => props.$isToday ? 'rgba(102, 126, 234, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
  opacity: ${props => props.$isCurrentMonth ? 1 : 0.4};
  
  &:hover {
    background: rgba(102, 126, 234, 0.05);
  }
`;

const LessonTag = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$score'
})<{ $score: number }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all 0.2s ease;
  color: white;
  background: ${props => {
    if (props.$score >= 80) return 'linear-gradient(135deg, #4CAF50, #66BB6A)';
    if (props.$score >= 60) return 'linear-gradient(135deg, #FF9800, #FFB74D)';
    return 'linear-gradient(135deg, #f44336, #EF5350)';
  }};
  box-shadow: 0 2px 8px ${props => {
    if (props.$score >= 80) return 'rgba(76, 175, 80, 0.3)';
    if (props.$score >= 60) return 'rgba(255, 152, 0, 0.3)';
    return 'rgba(244, 67, 54, 0.3)';
  }};
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px ${props => {
      if (props.$score >= 80) return 'rgba(76, 175, 80, 0.4)';
      if (props.$score >= 60) return 'rgba(255, 152, 0, 0.4)';
      return 'rgba(244, 67, 54, 0.4)';
    }};
  }
`;

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = 4;
  
  const [lessons, setLessons] = useState<Array<{
    id: number;
    title: string;
    date: string;
    status: string;
    score: number;
    duration: string;
    reportId: string;
  }>>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  
  // 보고서 제목 수정 관련 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ reportId: string; title: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    setMounted(true);
    setCurrentMonth(new Date());
    setLessonDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Supabase에서 보고서 목록 로드
  useEffect(() => {
    const loadReportsFromSupabase = async () => {
      if (!profile?.full_name) return;
      
      try {
        setLoadingLessons(true);
        const response = await fetch(`/api/reports/teacher/${encodeURIComponent(profile.full_name)}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const formattedLessons = result.data.map((report: any, index: number) => ({
            id: index + 1,
            title: report.title || '제목 없음',
            date: new Date(report.created_at).toISOString().split('T')[0],
            status: 'completed',
            score: report.total_score || 0,
            duration: report.video_duration || '-',
            reportId: report.report_id
          }));
          setLessons(formattedLessons);
        }
      } catch (error) {
        console.error('Failed to load reports from Supabase:', error);
      } finally {
        setLoadingLessons(false);
      }
    };
    
    if (profile?.full_name) {
      loadReportsFromSupabase();
    }
  }, [profile?.full_name]);

  // Admin 사용자 리다이렉트 처리
  useEffect(() => {
    if (profile?.role === 'admin') {
      router.replace('/admin-dashboard');
    }
  }, [profile?.role, router]);

  if (!mounted) {
    return null;
  }

  // 점수 관련 함수들
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#f44336';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  // 비디오 재생 시간 추출 함수
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('비디오 메타데이터를 읽을 수 없습니다.'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedVideoTypes = [
        'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
        'video/x-msvideo', 'video/webm', 'video/ogg'
      ];
      
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!allowedVideoTypes.includes(file.type) || !hasValidExtension) {
        alert(`지원하지 않는 파일 형식입니다.\n비디오 파일(MP4, MOV, AVI 등)만 업로드 가능합니다.`);
        event.target.value = '';
        return;
      }
      
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`파일 크기가 너무 큽니다.\n최대 500MB까지 업로드 가능합니다.`);
        event.target.value = '';
        return;
      }
      
      try {
        const duration = await getVideoDuration(file);
        const fileWithDuration = Object.assign(file, { 
          videoDuration: duration,
          formattedDuration: formatDuration(duration)
        });
        setSelectedFile(fileWithDuration);
      } catch (error) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    let currentProgress = 0;
    const simulateProgress = (target: number, duration: number) => {
      return new Promise<void>((resolve) => {
        const startProgress = currentProgress;
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - progress) * (1 - progress);
          currentProgress = startProgress + (target - startProgress) * eased;
          setUploadProgress(Math.round(currentProgress));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(animate);
      });
    };

    try {
      const finalTitle = lessonTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, "");
      
      simulateProgress(15, 800);
      
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('teacherId', profile?.full_name || 'Unknown Teacher');
      formData.append('title', finalTitle);
      formData.append('lessonDate', lessonDate);

      await simulateProgress(35, 1200);

      const responsePromise = fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      simulateProgress(85, 60000);

      const response = await responsePromise;

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || '업로드 실패');
        } catch (parseError) {
          throw new Error(`업로드 실패 (HTTP ${response.status})`);
        }
      }

      const result = await response.json();
      
      await simulateProgress(95, 500);

      // Supabase에서 최신 데이터 다시 로드
      const refreshReports = async () => {
        try {
          const response = await fetch(`/api/reports/teacher/${encodeURIComponent(profile?.full_name || '')}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const formattedLessons = result.data.map((report: any, index: number) => ({
              id: index + 1,
              title: report.title || '제목 없음',
              date: new Date(report.created_at).toISOString().split('T')[0],
              status: 'completed',
              score: report.total_score || 0,
              duration: report.video_duration || '-',
              reportId: report.report_id
            }));
            setLessons(formattedLessons);
          }
        } catch (error) {
          console.error('Failed to refresh reports:', error);
        }
      };
      
      refreshReports();
      
      await simulateProgress(100, 300);
      
      setTimeout(() => {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setLessonTitle('');
        setLessonDate(format(new Date(), 'yyyy-MM-dd'));
      }, 800);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleViewReport = (reportId: string) => {
    const teacherId = profile?.full_name || 'Unknown Teacher';
    router.push(`/reports/${teacherId}/${reportId}`);
  };

  // 보고서 제목 수정 다이얼로그 열기
  const handleOpenEditDialog = (reportId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    setEditingLesson({ reportId, title: currentTitle });
    setEditTitle(currentTitle);
    setEditError('');
    setEditDialogOpen(true);
  };

  // 보고서 제목 수정 저장
  const handleSaveTitle = async () => {
    if (!editingLesson || !editTitle.trim()) {
      setEditError('제목을 입력해주세요.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const response = await fetch('/api/reports/update-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: editingLesson.reportId,
          title: editTitle.trim(),
          teacherName: profile?.full_name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '제목 수정에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setLessons(prev => prev.map(lesson => 
        lesson.reportId === editingLesson.reportId
          ? { ...lesson, title: editTitle.trim() }
          : lesson
      ));

      setEditDialogOpen(false);
      setEditingLesson(null);
      setEditTitle('');
    } catch (error) {
      console.error('제목 수정 오류:', error);
      setEditError(error instanceof Error ? error.message : '제목 수정에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const refreshData = async () => {
    if (!profile?.full_name) return;
    setLoadingLessons(true);
    try {
      const response = await fetch(`/api/reports/teacher/${encodeURIComponent(profile.full_name)}`);
      const result = await response.json();
      if (result.success && result.data) {
        const formattedLessons = result.data.map((report: any, index: number) => ({
          id: index + 1,
          title: report.title || '제목 없음',
          date: new Date(report.created_at).toISOString().split('T')[0],
          status: 'completed',
          score: report.total_score || 0,
          duration: report.video_duration || '-',
          reportId: report.report_id
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(lessons.length / lessonsPerPage);
  const startIndex = (currentPage - 1) * lessonsPerPage;
  const currentLessons = lessons.slice(startIndex, startIndex + lessonsPerPage);

  const averageScore = lessons.length > 0
    ? Math.round(lessons.reduce((sum, lesson) => sum + (lesson.score || 0), 0) / lessons.length)
    : 0;

  const completedLessons = lessons.filter(lesson => lesson.status === 'completed').length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // 같은 날짜의 모든 수업을 반환
  const getLessonsForDate = (date: Date) => {
    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.date);
      return isSameDay(lessonDate, date);
    });
  };

  const handlePrevMonth = () => {
    if (currentMonth) setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    if (currentMonth) setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    const lessonsOnDate = getLessonsForDate(date);
    // 수업이 하나면 바로 이동, 여러 개면 첫 번째로 이동
    if (lessonsOnDate.length > 0) {
      handleViewReport(lessonsOnDate[0].reportId);
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <UserHeader />
      <PageBackground>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 12, pb: 6 }}>
          {/* 헤더 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FloatingIcon>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                        fontSize: '2rem',
                        fontWeight: 700
                      }}
                    >
                      {profile?.full_name?.charAt(0) || <SchoolIcon sx={{ fontSize: 40 }} />}
                    </Avatar>
                  </FloatingIcon>
                  <Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 800,
                        textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        mb: 0.5
                      }}
                    >
                      👋 {t('teacher.greeting')}, {profile?.full_name || t('teacher.dashboard')}!
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {t('teacher.welcomeMessage')}
                    </Typography>
                  </Box>
                </Box>
                
                <Tooltip title="새로고침">
                  <IconButton 
                    onClick={refreshData}
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </motion.div>

          {/* 통계 카드들 */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {[
              { 
                icon: <AssessmentIcon sx={{ fontSize: 36 }} />,
                value: completedLessons,
                label: t('teacher.analysisComplete'),
                gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
              },
              { 
                icon: <TrendingUpIcon sx={{ fontSize: 36 }} />,
                value: averageScore || '-',
                label: t('teacher.averageScore'),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                suffix: averageScore ? t('points') : ''
              },
              { 
                icon: <EmojiEventsIcon sx={{ fontSize: 36 }} />,
                value: averageScore >= 80 ? 'A' : averageScore >= 60 ? 'B' : averageScore > 0 ? 'C' : '-',
                label: t('teacher.grade'),
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              },
              { 
                icon: <StarIcon sx={{ fontSize: 36 }} />,
                value: lessons.length > 0 ? Math.max(...lessons.map(l => l.score)) : '-',
                label: t('teacher.highest'),
                gradient: 'linear-gradient(135deg, #FC5C7D 0%, #6A82FB 100%)',
                suffix: lessons.length > 0 ? t('points') : ''
              }
            ].map((card, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants}>
                  <StatCard gradient={card.gradient}>
                    <Box sx={{ position: 'relative', zIndex: 1, color: 'white', textAlign: 'center' }}>
                      <Box sx={{ mb: 1.5, opacity: 0.9 }}>{card.icon}</Box>
                      <Typography variant="h3" fontWeight="800" sx={{ mb: 0.5 }}>
                        {card.value}{card.suffix || ''}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {card.label}
                      </Typography>
                    </Box>
                  </StatCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={4}>
            {/* 업로드 섹션 */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <UploadCard
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <FloatingIcon>
                    <CloudUploadIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.8)', mb: 2 }} />
                  </FloatingIcon>
                  <Typography variant="h5" fontWeight="700" sx={{ color: 'white', mb: 1 }}>
                    새 수업 업로드
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                    수업 영상을 업로드하면<br/>AI가 자동으로 분석합니다
                  </Typography>
                  <PulseButton
                    variant="contained"
                    size="large"
                    startIcon={<VideoLibraryIcon />}
                    sx={{
                      bgcolor: 'white',
                      color: '#667eea',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                    }}
                  >
                    영상 선택하기
                  </PulseButton>
                </UploadCard>
              </motion.div>
            </Grid>

            {/* 수업 목록 */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <GlassCard>
                  <Box sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="700" sx={{ color: 'white', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      📋 수업 분석 결과
                      <Chip 
                        label={`${lessons.length}개`} 
                        size="small" 
                        sx={{ 
                          ml: 2, 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontWeight: 600
                        }} 
                      />
                    </Typography>

                    {loadingLessons ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: 'white', mb: 2 }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>불러오는 중...</Typography>
                      </Box>
                    ) : lessons.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <VideoLibraryIcon sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                          아직 분석된 수업이 없어요
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          첫 번째 수업을 업로드해보세요!
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Grid container spacing={2}>
                          {currentLessons.map((lesson, index) => (
                            <Grid item xs={12} sm={6} key={lesson.id}>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <LessonCard
                                  whileHover={{ scale: 1.02, y: -4 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleViewReport(lesson.reportId)}
                                >
                                  <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                      <Box sx={{ flex: 1, mr: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                          <Typography variant="subtitle1" fontWeight="700" sx={{ 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1
                                          }}>
                                            {lesson.title}
                                          </Typography>
                                          <Tooltip title="제목 수정">
                                            <IconButton 
                                              size="small" 
                                              onClick={(e) => handleOpenEditDialog(lesson.reportId, lesson.title, e)}
                                              sx={{ 
                                                p: 0.5,
                                                opacity: 0.6,
                                                '&:hover': { opacity: 1, bgcolor: 'rgba(102, 126, 234, 0.1)' }
                                              }}
                                            >
                                              <EditIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarTodayIcon sx={{ fontSize: 12 }} />
                                            {formatDate(lesson.date)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TimerIcon sx={{ fontSize: 12 }} />
                                            {lesson.duration}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      
                                      {/* 점수 뱃지 */}
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Box sx={{
                                          width: 44,
                                          height: 44,
                                          borderRadius: '50%',
                                          bgcolor: getScoreColor(lesson.score),
                                          color: 'white',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: 800,
                                          fontSize: '1rem',
                                          boxShadow: `0 4px 12px ${getScoreColor(lesson.score)}66`
                                        }}>
                                          {getScoreGrade(lesson.score)}
                                        </Box>
                                        <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600, color: getScoreColor(lesson.score) }}>
                                          {lesson.score}점
                                        </Typography>
                                      </Box>
                                    </Box>
                                    
                                    {/* 점수 바 */}
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={lesson.score} 
                                      sx={{ 
                                        height: 6, 
                                        borderRadius: 3,
                                        bgcolor: 'grey.200',
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 3,
                                          background: `linear-gradient(90deg, ${getScoreColor(lesson.score)}, ${getScoreColor(lesson.score)}99)`
                                        }
                                      }}
                                    />
                                  </CardContent>
                                </LessonCard>
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination 
                              count={totalPages}
                              page={currentPage}
                              onChange={handlePageChange}
                              sx={{
                                '& .MuiPaginationItem-root': {
                                  color: 'white',
                                  borderColor: 'rgba(255,255,255,0.3)',
                                  '&.Mui-selected': {
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                  }
                                }
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          </Grid>

          {/* 수업 캘린더 */}
          {currentMonth && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <CalendarContainer sx={{ mt: 4 }}>
              <CalendarHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarTodayIcon sx={{ color: '#667eea', fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#333' }}>
                    {t('teacher.calendar')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handlePrevMonth} sx={{ color: '#667eea' }}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ color: '#333', minWidth: 150, textAlign: 'center', fontWeight: 600 }}>
                    {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                  </Typography>
                  <IconButton onClick={handleNextMonth} sx={{ color: '#667eea' }}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg, #4CAF50, #66BB6A)' }} />
                    <Typography variant="caption" sx={{ color: '#666' }}>80+</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg, #FF9800, #FFB74D)' }} />
                    <Typography variant="caption" sx={{ color: '#666' }}>60-79</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 4, background: 'linear-gradient(135deg, #f44336, #EF5350)' }} />
                    <Typography variant="caption" sx={{ color: '#666' }}>60미만</Typography>
                  </Box>
                </Box>
              </CalendarHeader>

              <CalendarGrid>
                {/* 요일 헤더 */}
                {weekDays.map((day, idx) => (
                  <DayHeader key={day} sx={{ color: idx === 0 ? '#f44336' : idx === 6 ? '#2196F3' : '#666' }}>
                    {day}
                  </DayHeader>
                ))}
                
                {/* 날짜들 */}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  const lessonsOnDate = getLessonsForDate(date);
                  const isCurrentMonthDay = isSameMonth(date, currentMonth);
                  const isTodayDate = isToday(date);
                  const dayOfWeek = date.getDay();
                  
                  return (
                    <DayCell
                      key={index}
                      $isCurrentMonth={isCurrentMonthDay}
                      $isToday={isTodayDate}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: isTodayDate ? '#667eea' : dayOfWeek === 0 ? '#f44336' : dayOfWeek === 6 ? '#2196F3' : '#333',
                          fontWeight: isTodayDate ? 700 : 500,
                          fontSize: '0.9rem'
                        }}
                      >
                        {format(date, 'd')}
                      </Typography>
                      {/* 같은 날짜의 모든 수업 표시 (최대 3개, 이후 +N 표시) */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 0.3, 
                        width: '100%',
                        overflow: 'hidden'
                      }}>
                        {lessonsOnDate.slice(0, 3).map((lesson, lessonIndex) => (
                          <Tooltip key={lesson.reportId} title={`${lesson.title} (${lesson.score}점)`} arrow placement="top">
                            <LessonTag 
                              $score={lesson.score}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewReport(lesson.reportId);
                              }}
                              sx={{ fontSize: '0.65rem', py: 0.2 }}
                            >
                              {lesson.title.length > 6 ? lesson.title.slice(0, 6) + '..' : lesson.title}
                            </LessonTag>
                          </Tooltip>
                        ))}
                        {lessonsOnDate.length > 3 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              color: '#667eea', 
                              fontWeight: 600,
                              textAlign: 'center'
                            }}
                          >
                            +{lessonsOnDate.length - 3}개 더
                          </Typography>
                        )}
                      </Box>
                    </DayCell>
                  );
                })}
              </CalendarGrid>

              {/* 이번 달 수업 요약 */}
              <Box sx={{ 
                mt: 3, 
                pt: 3, 
                borderTop: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 2
              }}>
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(currentMonth);
                  const monthLessons = lessons.filter(lesson => {
                    const lessonDate = new Date(lesson.date);
                    return lessonDate >= monthStart && lessonDate <= monthEnd;
                  });
                  const monthAvg = monthLessons.length > 0 
                    ? Math.round(monthLessons.reduce((sum, l) => sum + l.score, 0) / monthLessons.length)
                    : 0;
                  
                  return (
                    <>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#667eea' }}>
                          {monthLessons.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          이번 달 수업
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="800" sx={{ color: monthAvg >= 80 ? '#4CAF50' : monthAvg >= 60 ? '#FF9800' : monthAvg > 0 ? '#f44336' : '#999' }}>
                          {monthAvg || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          평균 점수
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#9c27b0' }}>
                          {monthLessons.filter(l => l.score >= 80).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          우수 수업
                        </Typography>
                      </Box>
                    </>
                  );
                })()}
              </Box>
            </CalendarContainer>
          </motion.div>
          )}
        </Container>
      </PageBackground>

      {/* 업로드 다이얼로그 */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudUploadIcon sx={{ color: '#667eea' }} />
          수업 영상 업로드
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="수업 제목 (선택사항)"
            placeholder="비워두면 파일명이 제목으로 사용됩니다"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            margin="normal"
            disabled={uploading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#667eea' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />

          <TextField
            fullWidth
            label="수업 날짜"
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            margin="normal"
            disabled={uploading}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#667eea' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& input::-webkit-calendar-picker-indicator': {
                filter: 'invert(1)'
              }
            }}
          />
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="video-upload"
              disabled={uploading}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<VideoLibraryIcon />}
                disabled={uploading}
                sx={{ 
                  width: '100%', 
                  py: 2,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': { borderColor: '#667eea', bgcolor: 'rgba(102, 126, 234, 0.1)' }
                }}
              >
                {selectedFile ? selectedFile.name : '영상 파일 선택'}
              </Button>
            </label>
          </Box>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {uploadProgress < 15 ? '준비 중...' :
                   uploadProgress < 45 ? '파일 업로드 중...' :
                   uploadProgress < 85 ? 'AI 분석 진행 중...' :
                   uploadProgress < 100 ? '거의 완료...' : '완료!'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: uploadProgress === 100 ? '#4CAF50' : '#667eea' }}>
                  {Math.round(uploadProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: uploadProgress === 100 
                      ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                      : 'linear-gradient(90deg, #667eea, #764ba2)',
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                {uploadProgress < 100 ? '분석에는 약 5~10분이 소요됩니다' : '✅ 분석이 완료되었습니다!'}
              </Typography>
            </Box>
          )}

          {selectedFile && !uploading && (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': { color: '#667eea' }
              }}
            >
              📁 파일 크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              {(selectedFile as any).formattedDuration && (
                <><br />⏱️ 재생 시간: {(selectedFile as any).formattedDuration}</>
              )}
              <br />⏳ 예상 분석 시간: 5-10분
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setUploadDialogOpen(false)} 
            disabled={uploading}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CloudUploadIcon />}
            sx={{
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5a6fd6' },
              borderRadius: 2,
              px: 3
            }}
          >
            {uploading ? '업로드 중...' : '업로드 시작'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 제목 수정 다이얼로그 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editLoading && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon sx={{ color: '#667eea' }} />
            보고서 제목 수정
          </Box>
          <IconButton 
            onClick={() => setEditDialogOpen(false)}
            disabled={editLoading}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {editError}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="보고서 제목"
            placeholder="새로운 제목을 입력하세요"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={editLoading}
            autoFocus
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#667eea' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' }
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            disabled={editLoading}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTitle}
            disabled={!editTitle.trim() || editLoading}
            startIcon={editLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
            sx={{
              bgcolor: '#667eea',
              '&:hover': { bgcolor: '#5a6fd6' },
              borderRadius: 2,
              px: 3
            }}
          >
            {editLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}
