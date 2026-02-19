'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  Checkbox,
  FormGroup,
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import UserHeader from '../../../../components/layout/UserHeader';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

interface TeacherStat {
  name: string;
  reportCount: number;
  avgScore: number;
  lastReportDate: string;
  avgScores: {
    student_participation: number;
    concept_explanation: number;
    feedback: number;
    structure: number;
    interaction: number;
  };
}

const COLORS = ['#3f51b5', '#f50057', '#4caf50', '#ff9800', '#9c27b0'];

// 이름의 첫 글자 추출
const getInitial = (name: string) => {
  return name ? name.charAt(0) : '?';
};

export default function ComparePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherList, setTeacherList] = useState<TeacherStat[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // 선생님 목록에 인덱스 추가
  const teachersWithIndex = useMemo(() => {
    return teacherList.map((teacher, index) => ({
      ...teacher,
      originalIndex: index
    }));
  }, [teacherList]);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reports/stats');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '데이터를 불러올 수 없습니다.');
      }
      
      setTeacherList(result.stats.teacherList || []);
    } catch (err) {
      console.error('선생님 목록 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherToggle = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= 4) {
        return prev; // 최대 4명까지
      }
      return [...prev, index];
    });
  };

  const selectedData = teachersWithIndex.filter(t => selectedIndices.includes(t.originalIndex));

  // 레이더 차트 데이터
  const radarData = [
    { subject: t('category.studentParticipation'), key: 'student_participation', fullMark: 20 },
    { subject: t('category.conceptExplanation'), key: 'concept_explanation', fullMark: 20 },
    { subject: t('category.feedback'), key: 'feedback', fullMark: 20 },
    { subject: t('category.structure'), key: 'structure', fullMark: 20 },
    { subject: t('category.interaction'), key: 'interaction', fullMark: 20 },
  ].map(item => {
    const dataPoint: any = { subject: item.subject, fullMark: item.fullMark };
    selectedData.forEach(teacher => {
      dataPoint[teacher.name] = teacher.avgScores[item.key as keyof typeof teacher.avgScores];
    });
    return dataPoint;
  });

  // 막대 차트 데이터
  const barData = [
    { name: t('category.studentParticipation'), key: 'student_participation' },
    { name: t('category.conceptExplanation'), key: 'concept_explanation' },
    { name: t('category.feedback'), key: 'feedback' },
    { name: t('category.structure'), key: 'structure' },
    { name: t('category.interaction'), key: 'interaction' },
    { name: t('stats.averageScore'), key: 'avgScore' },
  ].map(item => {
    const dataPoint: any = { name: item.name };
    selectedData.forEach(teacher => {
      if (item.key === 'avgScore') {
        dataPoint[teacher.name] = teacher.avgScore;
      } else {
        dataPoint[teacher.name] = teacher.avgScores[item.key as keyof typeof teacher.avgScores];
      }
    });
    return dataPoint;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
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
            대시보드로 돌아가기
          </Button>

          {/* 헤더 */}
          <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CompareArrowsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  선생님 종합 분석
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  최대 4명의 선생님을 선택하여 비교해보세요
                </Typography>
              </Box>
            </Box>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : teacherList.length === 0 ? (
            <Alert severity="info">아직 등록된 선생님이 없습니다.</Alert>
          ) : (
            <Grid container spacing={3}>
              {/* 선생님 선택 패널 */}
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 100 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    선생님 선택 ({selectedIndices.length}/4)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <FormGroup>
                    {teachersWithIndex.map((teacher) => (
                      <Card 
                        key={teacher.originalIndex}
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          border: selectedIndices.includes(teacher.originalIndex) ? 2 : 1,
                          borderColor: selectedIndices.includes(teacher.originalIndex) 
                            ? COLORS[selectedIndices.indexOf(teacher.originalIndex) % COLORS.length] 
                            : 'grey.200',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => handleTeacherToggle(teacher.originalIndex)}
                      >
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              checked={selectedIndices.includes(teacher.originalIndex)}
                              onChange={() => handleTeacherToggle(teacher.originalIndex)}
                              disabled={!selectedIndices.includes(teacher.originalIndex) && selectedIndices.length >= 4}
                              sx={{ p: 0 }}
                            />
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: selectedIndices.includes(teacher.originalIndex) 
                                  ? COLORS[selectedIndices.indexOf(teacher.originalIndex) % COLORS.length]
                                  : 'grey.300',
                                fontSize: '0.9rem',
                                fontWeight: 700
                              }}
                            >
                              {getInitial(teacher.name)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {teacher.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                평균 {teacher.avgScore}점 · {teacher.reportCount}회
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </FormGroup>
                </Paper>
              </Grid>

              {/* 비교 차트 영역 */}
              <Grid item xs={12} md={9}>
                {selectedIndices.length < 2 ? (
                  <Paper sx={{ p: 8, borderRadius: 3, textAlign: 'center' }}>
                    <CompareArrowsIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      비교할 선생님을 2명 이상 선택해주세요
                    </Typography>
                  </Paper>
                ) : (
                  <>
                    {/* 선택된 선생님 칩 */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                      {selectedData.map((teacher, index) => (
                        <Chip
                          key={teacher.originalIndex}
                          avatar={
                            <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], fontWeight: 700 }}>
                              {getInitial(teacher.name)}
                            </Avatar>
                          }
                          label={`${teacher.name} (${teacher.avgScore}점)`}
                          onDelete={() => handleTeacherToggle(teacher.originalIndex)}
                          sx={{ 
                            borderColor: COLORS[index % COLORS.length],
                            borderWidth: 2,
                            borderStyle: 'solid'
                          }}
                        />
                      ))}
                    </Box>

                    {/* 레이더 차트 */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        영역별 비교 (레이더 차트)
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 20]} />
                            {selectedData.map((teacher, index) => (
                              <Radar
                                key={teacher.originalIndex}
                                name={teacher.name}
                                dataKey={teacher.name}
                                stroke={COLORS[index % COLORS.length]}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                            ))}
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>

                    {/* 막대 차트 */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        영역별 비교 (막대 그래프)
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            {selectedData.map((teacher, index) => (
                              <Bar
                                key={teacher.originalIndex}
                                dataKey={teacher.name}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>

                    {/* 상세 비교 테이블 */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        상세 점수 비교
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedData.map((teacher, index) => (
                          <Grid item xs={12} sm={6} md={selectedData.length <= 2 ? 6 : 4} key={teacher.originalIndex}>
                            <Card sx={{ borderTop: 4, borderColor: COLORS[index % COLORS.length] }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                  <Avatar sx={{ bgcolor: COLORS[index % COLORS.length], fontWeight: 700 }}>
                                    {getInitial(teacher.name)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                      {teacher.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      총 {teacher.reportCount}회 수업
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                <Box sx={{ mb: 1 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">평균 총점</Typography>
                                    <Typography variant="body2" fontWeight="bold" color={getScoreColor(teacher.avgScore)}>
                                      {teacher.avgScore}점
                                    </Typography>
                                  </Box>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                
                                {[
                                  { label: t('category.studentParticipation'), value: teacher.avgScores.student_participation },
                                  { label: t('category.conceptExplanation'), value: teacher.avgScores.concept_explanation },
                                  { label: t('category.feedback'), value: teacher.avgScores.feedback },
                                  { label: t('category.structure'), value: teacher.avgScores.structure },
                                  { label: t('category.interaction'), value: teacher.avgScores.interaction },
                                ].map(item => (
                                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                    <Typography variant="body2" fontWeight="medium">{item.value}</Typography>
                                  </Box>
                                ))}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
