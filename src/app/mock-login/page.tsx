'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material'

export default function MockLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleMockLogin = () => {
    // 임시 로컬스토리지에 목업 사용자 저장
    const mockUser = {
      id: '7221ee18-05d5-4e9b-83c9-bd1382b07505',
      email: email,
      role: email.includes('admin') ? 'admin' : 'teacher',
      full_name: email.includes('admin') ? '관리자' : '김선생님'
    }
    
    localStorage.setItem('mockUser', JSON.stringify(mockUser))
    
    // 페이지 이동
    if (mockUser.role === 'admin') {
      router.push('/admin-dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        gap: 3
      }}>
        <Typography variant="h4" textAlign="center" gutterBottom>
          🧪 목업 로그인 (테스트용)
        </Typography>
        
        <Alert severity="info">
          Supabase 연결 문제로 인한 임시 테스트 페이지입니다.
        </Alert>

        <TextField
          fullWidth
          label="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="youngjik@test.com 또는 admin@test.com"
        />
        
        <TextField
          fullWidth
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="아무거나 입력"
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleMockLogin}
          disabled={!email}
          sx={{ py: 1.5 }}
        >
          목업 로그인
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            📝 <strong>테스트 계정:</strong><br/>
            • youngjik@test.com / test1234 → 선생님 페이지<br/>
            • admin@test.com → 관리자 페이지
          </Typography>
        </Box>
      </Box>
    </Container>
  )
} 