'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton
} from '@mui/material';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useLanguage } from '../../../../../contexts/LanguageContext';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import UserHeader from '../../../../../components/layout/UserHeader';
import { motion } from 'framer-motion';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// Styled Components
const AICard = styled(Paper)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  color: white;
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

const AIContent = styled(Box)`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  color: #333;
  margin-top: 16px;
  white-space: pre-wrap;
  line-height: 1.8;
  
  h2, h3 {
    color: #667eea;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  strong {
    color: #764ba2;
  }
`;

const LoadingDots = styled(Box)`
  display: inline-flex;
  gap: 4px;
  
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: white;
    animation: ${pulse} 1.4s infinite;
    
    &:nth-of-type(2) { animation-delay: 0.2s; }
    &:nth-of-type(3) { animation-delay: 0.4s; }
  }
`;

// 이름의 첫 글자 추출
const getInitial = (name: string) => {
  return name ? name.charAt(0) : '?';
};

interface Summary {
  totalReports: number;
  averageScores: {
    student_participation: number;
    concept_explanation: number;
    feedback: number;
    structure: number;
    interaction: number;
    total: number;
  };
  scoreHistory: Array<{
    date: string;
    title: string;
    report_id: string;
    student_participation: number;
    concept_explanation: number;
    feedback: number;
    structure: number;
    interaction: number;
    total: number;
  }>;
  maxScore: number;
  minScore: number;
  recentScore: number;
  trend: 'improving' | 'declining' | 'stable';
  topStrengths: Array<{ text: string; count: number }>;
  topImprovements: Array<{ text: string; count: number }>;
  topStrengths_en?: Array<{ text: string; count: number }>;
  topImprovements_en?: Array<{ text: string; count: number }>;
  firstReportDate: string;
  lastReportDate: string;
}

export default function TeacherEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const teacherName = decodeURIComponent(params.teacherName as string);
  
  // 실제 이름 사용
  const displayName = teacherName;
  const initial = getInitial(teacherName);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  // AI 분석 상태
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [teacherName]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/reports/summary/${encodeURIComponent(teacherName)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '데이터를 불러올 수 없습니다.');
      }
      
      setSummary(result.summary);
    } catch (err) {
      console.error('종합 평가 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // AI 종합 분석 로드
  const loadAiSummary = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      
      const response = await fetch(`/api/reports/ai-summary/${encodeURIComponent(teacherName)}?language=${language}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'AI 분석을 불러올 수 없습니다.');
      }
      
      setAiSummary(result.aiSummary);
    } catch (err) {
      console.error('AI 종합 분석 로드 실패:', err);
      setAiError(err instanceof Error ? err.message : 'AI 분석을 불러올 수 없습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  // 언어 변경 시 AI 요약 재로드
  useEffect(() => {
    if (aiSummary && !aiLoading) {
      loadAiSummary();
    }
  }, [language]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      case 'declining':
        return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      default:
        return <TrendingFlatIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return t('admin.trendImproving');
      case 'declining':
        return t('admin.trendDeclining');
      default:
        return t('admin.trendStable');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const radarData = summary ? [
    { subject: t('category.studentParticipation'), value: summary.averageScores.student_participation, fullMark: 20 },
    { subject: t('category.conceptExplanation'), value: summary.averageScores.concept_explanation, fullMark: 20 },
    { subject: t('category.feedback'), value: summary.averageScores.feedback, fullMark: 20 },
    { subject: t('category.structure'), value: summary.averageScores.structure, fullMark: 20 },
    { subject: t('category.interaction'), value: summary.averageScores.interaction, fullMark: 20 },
  ] : [];

  const lineChartData = summary?.scoreHistory.map((item, index) => ({
    name: `${index + 1}${t('admin.classCount')}`,
    [t('admin.totalScore')]: item.total,
    [t('admin.studentParticipation')]: item.student_participation,
    [t('admin.conceptExplanation')]: item.concept_explanation,
    [t('admin.feedbackScore')]: item.feedback,
    [t('admin.structure')]: item.structure,
    [t('admin.interactionScore')]: item.interaction
  })) || [];

  // AI 분석 내용을 마크다운 형식으로 표시
  const formatAiContent = (content: string) => {
    // 제목 스타일링
    let formatted = content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^(\d+)\.\s+/gm, '<br/><strong>$1.</strong> ')
      .replace(/^-\s+/gm, '• ');
    
    return formatted;
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserHeader />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa', py: 4 }}>
        <Container maxWidth="xl">
          {/* 뒤로가기 버튼 */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin-dashboard')}
            sx={{ mb: 3 }}
          >
            {t('admin.backToDashboard')}
          </Button>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !summary ? (
            <Alert severity="info">
              {t('admin.noReportsYet').replace('{name}', displayName)}
            </Alert>
          ) : (
            <>
              {/* 헤더 카드 */}
              <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                      fontSize: '2rem',
                      fontWeight: 700
                    }}>
                      {initial}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {displayName}{t('admin.teacher')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<AssessmentIcon />} 
                        label={`${t('admin.totalClasses')} ${summary.totalReports}${t('admin.classesCount')}`}
                        color="primary"
                      />
                      <Chip 
                        icon={<StarIcon />} 
                        label={`${t('admin.average')} ${summary.averageScores.total}${t('admin.points')}`}
                        sx={{ bgcolor: getScoreColor(summary.averageScores.total), color: 'white' }}
                      />
                      <Chip 
                        icon={getTrendIcon(summary.trend)} 
                        label={getTrendText(summary.trend)}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.firstClass')}: {formatDate(summary.firstReportDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('admin.recentClass')}: {formatDate(summary.lastReportDate)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* 🤖 AI 종합 분석 섹션 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AICard sx={{ mb: 4 }}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PsychologyIcon sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h5" fontWeight="bold">
                            🤖 {t('admin.comprehensiveEvaluation')}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {t('admin.aiAnalysisDescription').replace('{name}', displayName)}
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title={aiSummary ? t('admin.regenerateAiSummary') : t('admin.aiAnalysisStart')}>
                        <IconButton 
                          onClick={loadAiSummary}
                          disabled={aiLoading}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          {aiLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <AutoAwesomeIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {!aiSummary && !aiLoading && !aiError && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<AutoAwesomeIcon />}
                          onClick={loadAiSummary}
                          sx={{ 
                            bgcolor: 'white', 
                            color: '#667eea',
                            fontWeight: 'bold',
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                          }}
                        >
                          {t('admin.generateAiSummary')}
                        </Button>
                        <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
                          {t('admin.clickToAnalyze')} {summary.totalReports}{t('admin.aiSummaryDescription')}
                        </Typography>
                      </Box>
                    )}

                    {aiLoading && (
                      <AIContent sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress size={50} sx={{ mb: 3 }} />
                        <Typography variant="h6" gutterBottom>
                          AI가 {summary.totalReports}개의 수업 데이터를 분석 중입니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          잠시만 기다려주세요... (약 10-20초 소요)
                        </Typography>
                      </AIContent>
                    )}

                    {aiError && (
                      <AIContent>
                        <Alert severity="error" sx={{ mb: 2 }}>{aiError}</Alert>
                        <Button 
                          variant="outlined" 
                          startIcon={<RefreshIcon />}
                          onClick={loadAiSummary}
                        >
                          {t('admin.retry')}
                        </Button>
                      </AIContent>
                    )}

                    {aiSummary && !aiLoading && (
                      <AIContent>
                        <Box 
                          dangerouslySetInnerHTML={{ __html: formatAiContent(aiSummary) }}
                          sx={{
                            '& h3': { 
                              color: '#667eea', 
                              fontSize: '1.2rem', 
                              fontWeight: 700, 
                              mt: 3, 
                              mb: 1,
                              borderBottom: '2px solid #667eea',
                              pb: 1
                            },
                            '& h4': { 
                              color: '#764ba2', 
                              fontSize: '1.1rem', 
                              fontWeight: 600, 
                              mt: 2, 
                              mb: 1 
                            },
                            '& strong': { 
                              color: '#764ba2' 
                            }
                          }}
                        />
                      </AIContent>
                    )}
                  </Box>
                </AICard>
              </motion.div>

              {/* 점수 요약 카드들 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">최고 점수</Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {summary.maxScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">최저 점수</Typography>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {summary.minScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">최근 점수</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {summary.recentScore}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {/* 최고/최저 영역 - 동적으로 계산 */}
                {(() => {
                  const scores = [
                    { name: t('category.studentParticipation'), value: summary.averageScores.student_participation },
                    { name: t('category.conceptExplanation'), value: summary.averageScores.concept_explanation },
                    { name: t('category.feedback'), value: summary.averageScores.feedback },
                    { name: t('category.structure'), value: summary.averageScores.structure },
                    { name: t('category.interaction'), value: summary.averageScores.interaction },
                  ];
                  const sorted = [...scores].sort((a, b) => b.value - a.value);
                  const highest = sorted[0];
                  const lowest = sorted[sorted.length - 1];
                  
                  return (
                    <>
                      <Grid item xs={6} sm={4} md={3}>
                        <Card sx={{ bgcolor: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="success.main" fontWeight="600">🏆 최고 영역</Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                              {highest.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {highest.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={4} md={3}>
                        <Card sx={{ bgcolor: 'rgba(255, 152, 0, 0.08)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="warning.main" fontWeight="600">📈 개선 필요</Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                              {lowest.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {lowest.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  );
                })()}
              </Grid>

              {/* 차트 영역 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* 레이더 차트 */}
                <Grid item xs={12} md={5}>
                  <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      📊 {t('admin.averageByCategory')}
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 20]} />
                          <Radar
                            name={displayName}
                            dataKey="value"
                            stroke="#667eea"
                            fill="#667eea"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                {/* 추이 차트 */}
                <Grid item xs={12} md={7}>
                  <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      📈 점수 변화 추이
                    </Typography>
                    <Box sx={{ height: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip />
                          <Legend />
                          <Line type="monotone" dataKey={t('admin.totalScore')} stroke="#667eea" strokeWidth={3} />
                          <Line type="monotone" dataKey={t('admin.studentParticipation')} stroke="#4caf50" strokeWidth={1} />
                          <Line type="monotone" dataKey={t('admin.conceptExplanation')} stroke="#ff9800" strokeWidth={1} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* 강점/개선점 */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" /> {t('admin.keyStrengths')}
                    </Typography>
                    <List>
                      {((language === 'en' && summary.topStrengths_en && summary.topStrengths_en.length > 0) 
                        ? summary.topStrengths_en 
                        : summary.topStrengths
                      ).length > 0 ? (
                        (language === 'en' && summary.topStrengths_en && summary.topStrengths_en.length > 0
                          ? summary.topStrengths_en 
                          : summary.topStrengths
                        ).map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <StarIcon sx={{ color: 'warning.main' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text}
                              secondary={`${item.count}${t('admin.mentionCount')}`}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary={language === 'en' ? 'No strengths analyzed yet.' : '아직 분석된 강점이 없습니다.'} />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" /> {t('admin.areasForImprovement')}
                    </Typography>
                    <List>
                      {((language === 'en' && summary.topImprovements_en && summary.topImprovements_en.length > 0) 
                        ? summary.topImprovements_en 
                        : summary.topImprovements
                      ).length > 0 ? (
                        (language === 'en' && summary.topImprovements_en && summary.topImprovements_en.length > 0
                          ? summary.topImprovements_en 
                          : summary.topImprovements
                        ).map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <WarningIcon sx={{ color: 'grey.400' }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text}
                              secondary={`${item.count}${t('admin.mentionCount')}`}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary={language === 'en' ? 'No improvements analyzed yet.' : '아직 분석된 개선점이 없습니다.'} />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              {/* 수업 목록 */}
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📋 {t('admin.classRecords')} ({summary.scoreHistory.length}{t('admin.classCount')})
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>{t('admin.classTitle')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.totalScore')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.studentParticipation')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.conceptExplanation')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.feedbackScore')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.structure')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.interactionScore')}</strong></TableCell>
                        <TableCell><strong>{t('admin.date')}</strong></TableCell>
                        <TableCell align="center"><strong>{t('admin.details')}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.scoreHistory.map((report, index) => (
                        <TableRow key={report.report_id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{report.title || '제목 없음'}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={report.total}
                              size="small"
                              sx={{ 
                                bgcolor: getScoreColor(report.total),
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">{report.student_participation}</TableCell>
                          <TableCell align="center">{report.concept_explanation}</TableCell>
                          <TableCell align="center">{report.feedback}</TableCell>
                          <TableCell align="center">{report.structure}</TableCell>
                          <TableCell align="center">{report.interaction}</TableCell>
                          <TableCell>{formatDate(report.date)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="보고서 보기">
                              <IconButton 
                                color="primary"
                                onClick={() => router.push(`/reports/${encodeURIComponent(teacherName)}/${report.report_id}`)}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
