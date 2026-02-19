'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { useRouter } from 'next/navigation'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export default function DebugProfilePage() {
  const { user, profile, loading, profileLoading } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    if (!loading && user && profile) {
      setProfileData({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        },
        profile: profile
      })
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4">인증 로딩 중...</Typography>
      </Container>
    )
  }

  if (profileLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4">프로필 정보 로딩 중...</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Supabase에서 사용자 프로필을 가져오는 중입니다. 잠시만 기다려주세요.
        </Typography>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          로그인이 필요합니다. <Button onClick={() => router.push('/auth')}>로그인 페이지로</Button>
        </Alert>
      </Container>
    )
  }

  const getExpectedRedirect = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard'
      case 'teacher':
        return '/'
      default:
        return '/'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자 - 시스템 전체 관리 권한'
      case 'teacher':
        return '교사 - 개인 수업 분석 및 관리'
      default:
        return '알 수 없는 역할'
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🔍 프로필 디버깅 정보
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            👤 사용자 정보 (Auth)
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="사용자 ID" 
                secondary={profileData?.user?.id || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="이메일" 
                secondary={profileData?.user?.email || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="계정 생성일" 
                secondary={profileData?.user?.created_at || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="마지막 로그인" 
                secondary={profileData?.user?.last_sign_in_at || 'N/A'} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 프로필 정보 (Database)
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="프로필 ID" 
                secondary={profileData?.profile?.id || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="이름" 
                secondary={profileData?.profile?.full_name || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="역할 (Role)" 
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={profileData?.profile?.role || 'N/A'} 
                      color={
                        profileData?.profile?.role === 'admin' ? 'error' : 'primary'
                      }
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getRoleDescription(profileData?.profile?.role)}
                    </Typography>
                  </Box>
                } 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="학교" 
                secondary={profileData?.profile?.school_name || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="전화번호" 
                secondary={profileData?.profile?.phone_number || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="프로필 생성일" 
                secondary={profileData?.profile?.created_at || 'N/A'} 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="프로필 수정일" 
                secondary={profileData?.profile?.updated_at || 'N/A'} 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 리다이렉트 정보
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            현재 역할: <strong>{profileData?.profile?.role}</strong><br/>
            예상 리다이렉트: <strong>{getExpectedRedirect(profileData?.profile?.role)}</strong>
          </Alert>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">🔧 문제 해결 가이드</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>선생님으로 로그인했는데 이미지 분석 페이지로 가지 않는 경우:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="1. 역할 확인" 
                    secondary="위에서 role이 'teacher'로 표시되는지 확인" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="2. 리다이렉트 경로 확인" 
                    secondary="예상 리다이렉트가 '/' (메인 페이지)로 표시되는지 확인" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="3. 브라우저 콘솔 확인" 
                    secondary="F12 → Console에서 리다이렉트 로그 확인" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="4. 수동 이동 테스트" 
                    secondary="아래 버튼으로 메인 페이지 직접 이동 테스트" 
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧪 테스트 도구
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={() => router.push('/auth')}
            >
              로그인 페이지로
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/')}
            >
              메인 페이지로 (선생님 대시보드)
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/admin-dashboard')}
            >
              관리자 대시보드로
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
} 