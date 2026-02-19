'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import { useAuth } from '../../../contexts/AuthContext'

export default function LogoutPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      // 로컬 스토리지도 클리어
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      router.push('/auth')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#FFFFF0',
        gap: 3
      }}
    >
      <Typography variant="h4" gutterBottom>
        로그아웃
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        현재 세션을 종료하시겠습니까?
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
        <Button
          variant="outlined"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </Box>
    </Box>
  )
} 