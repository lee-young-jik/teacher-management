'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import UserHeader from '../../../components/layout/UserHeader';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import LogoutIcon from '@mui/icons-material/Logout';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
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
      radial-gradient(circle at 10% 20%, rgba(255, 107, 107, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 90% 80%, rgba(78, 205, 196, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 50% 50%, rgba(107, 107, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const StatCard = styled(motion.div)<{ gradient: string }>`
  background: ${props => props.gradient};
  border-radius: 14px;
  padding: 1rem;
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

const TeacherCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  }
`;

const FloatingIcon = styled(Box)`
  animation: ${float} 3s ease-in-out infinite;
`;

// 이름의 첫 글자 추출
const getInitial = (name: string) => {
  return name ? name.charAt(0) : '?';
};

interface ReportStats {
  totalReports: number;
  totalTeachers: number;
  averageScore: number;
  recentReports: any[];
  teacherList: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, signOut, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reports/stats');
      const data = await response.json();
      if (response.ok) {
        setReportStats(data.stats);
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  };

  if (!isClient || authLoading) {
    return (
      <PageBackground>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} sx={{ color: 'white' }} />
        </Box>
      </PageBackground>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserHeader />
      <PageBackground>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pt: 12, pb: 6 }}>
          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 3 }}>
              {/* 브랜드 태그라인 */}
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: 'fit-content',
                    px: 1.2,
                    py: 0.5,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    AI-POWERED LESSON ANALYTICS PLATFORM
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FloatingIcon>
                    <Avatar 
                      sx={{ 
                        width: 52, 
                        height: 52, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)'
                      }}
                    >
                      <AdminPanelSettingsIcon sx={{ fontSize: 26 }} />
                    </Avatar>
                  </FloatingIcon>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 800,
                        textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        mb: 0.3,
                        fontSize: '1.25rem'
                      }}
                    >
                      👋 {t('admin.greeting')}, {profile?.full_name || user?.email}!
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                      {t('admin.welcomeMessage')}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="새로고침">
                    <IconButton 
                      onClick={loadData}
                      size="small"
                      sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button 
                    variant="contained"
                    onClick={handleSignOut}
                    startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.15)',
                      borderRadius: 2,
                      px: 2,
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                    }}
                  >
                    로그아웃
                  </Button>
                </Box>
              </Box>
            </Box>
          </motion.div>

          {/* 통계 카드 - 항상 표시 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { 
                icon: <PeopleIcon sx={{ fontSize: 24 }} />,
                value: loading ? '-' : (reportStats?.totalTeachers || 0),
                label: t('admin.totalTeachers'),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              { 
                icon: <ArticleIcon sx={{ fontSize: 24 }} />,
                value: loading ? '-' : (reportStats?.totalReports || 0),
                label: t('admin.totalReports'),
                gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
              },
              { 
                icon: <AutoGraphIcon sx={{ fontSize: 24 }} />,
                value: loading ? '-' : (reportStats?.averageScore || 0),
                label: t('admin.averageScore'),
                gradient: 'linear-gradient(135deg, #FC5C7D 0%, #6A82FB 100%)',
                suffix: loading ? '' : t('points')
              },
              { 
                icon: <CompareArrowsIcon sx={{ fontSize: 24 }} />,
                value: t('admin.analysis'),
                label: t('admin.analysis'),
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                onClick: () => router.push('/admin-dashboard/compare')
              }
            ].map((card, index) => (
              <Grid item xs={6} sm={6} md={3} key={index}>
                <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants}>
                  <StatCard 
                    gradient={card.gradient}
                    onClick={card.onClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ cursor: card.onClick ? 'pointer' : 'default' }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1, color: 'white', textAlign: 'center' }}>
                      <Box sx={{ mb: 1, opacity: 0.9 }}>{card.icon}</Box>
                      <Typography variant="h5" fontWeight="800" sx={{ mb: 0.3, fontSize: '1.3rem' }}>
                        {card.value}{card.suffix || ''}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                        {card.label}
                      </Typography>
                    </Box>
                  </StatCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
              <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                선생님 데이터를 불러오는 중...
              </Typography>
            </Box>
          ) : (
            <>

              {/* 선생님 목록 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Box sx={{ 
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  p: 2.5
                }}>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                    <SchoolIcon sx={{ fontSize: 20 }} /> {t('admin.teacherList')}
                    <Typography component="span" sx={{ 
                      ml: 1.5, 
                      px: 1.5, 
                      py: 0.3, 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      borderRadius: 1.5,
                      fontSize: '0.75rem'
                    }}>
                      {reportStats?.teacherList?.length || 0}{t('admin.teacherCount')}
                    </Typography>
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {reportStats?.teacherList && reportStats.teacherList.length > 0 ? (
                      reportStats.teacherList.slice(0, 4).map((teacher: any, index: number) => (
                        <Grid item xs={6} sm={6} md={6} key={teacher.name}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                          >
                            <TeacherCard
                              whileHover={{ scale: 1.02, y: -4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => router.push(`/admin-dashboard/evaluation/${encodeURIComponent(teacher.name)}?idx=${index}`)}
                            >
                              <CardContent sx={{ p: 2 }}>
                                {/* 순위 뱃지 */}
                                {index < 3 && (
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    top: 12, 
                                    right: 10,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                  }}>
                                    <EmojiEventsIcon sx={{ fontSize: 12, color: 'white' }} />
                                  </Box>
                                )}

                                {/* 프로필 */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                  <Avatar sx={{ 
                                    width: 36, 
                                    height: 36, 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontSize: '0.9rem',
                                    fontWeight: 700
                                  }}>
                                    {getInitial(teacher.name)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ lineHeight: 1.2, fontSize: '0.85rem' }}>
                                      {teacher.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {t('admin.reportsCount')} {teacher.reportCount}{t('admin.reportsUnit')}
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                {/* 점수 */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  mb: 1.5,
                                  p: 1,
                                  bgcolor: 'rgba(102, 126, 234, 0.08)',
                                  borderRadius: 1.5
                                }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{t('admin.avgScoreLabel')}</Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight="800" sx={{ color: getScoreColor(teacher.avgScore), fontSize: '1rem' }}>
                                      {teacher.avgScore}
                                    </Typography>
                                    <Box sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: getScoreColor(teacher.avgScore),
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.6rem'
                                    }}>
                                      {getScoreGrade(teacher.avgScore)}
                                    </Box>
                                  </Box>
                                </Box>

                                {/* 프로그레스 바 */}
                                <LinearProgress 
                                  variant="determinate" 
                                  value={teacher.avgScore} 
                                  sx={{ 
                                    height: 4, 
                                    borderRadius: 2, 
                                    bgcolor: 'grey.200', 
                                    mb: 1,
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      background: `linear-gradient(90deg, ${getScoreColor(teacher.avgScore)}, ${getScoreColor(teacher.avgScore)}99)`
                                    }
                                  }}
                                />

                                {/* 하단 */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: '0.65rem' }}>
                                    <CalendarTodayIcon sx={{ fontSize: 10 }} />
                                    {formatDate(teacher.lastReportDate)}
                                  </Typography>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.3,
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    fontSize: '0.7rem'
                                  }}>
                                    {t('admin.viewReports')}
                                    <ArrowForwardIcon sx={{ fontSize: 12 }} />
                                  </Box>
                                </Box>
                              </CardContent>
                            </TeacherCard>
                          </motion.div>
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', py: 10 }}>
                          <PeopleIcon sx={{ fontSize: 100, color: 'rgba(255,255,255,0.2)', mb: 3 }} />
                          <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                            등록된 선생님이 없습니다
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            선생님이 수업 영상을 업로드하면 여기에 표시됩니다
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </motion.div>
            </>
          )}
        </Container>
      </PageBackground>
    </ProtectedRoute>
  );
}
