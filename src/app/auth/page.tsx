'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Container, 
  Typography, 
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { useAuth } from '../../../contexts/AuthContext'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

// Styled Components
const PageBackground = styled(Box)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d1f 100%);
  position: relative;
  overflow: hidden;
`

const FloatingOrb = styled(Box)<{ size: number; top: string; left: string; delay: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3));
  filter: blur(60px);
  top: ${props => props.top};
  left: ${props => props.left};
  animation: ${float} ${props => 6 + props.delay}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`

const GridPattern = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: ${pulse} 4s ease-in-out infinite;
`

const AuthCard = styled(Box)`
  animation: ${fadeIn} 0.8s ease-out;
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  padding: 40px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`

const LogoSection = styled(Box)`
  text-align: center;
  margin-bottom: 32px;
`

const LogoIcon = styled(Box)`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 32px rgba(99, 102, 241, 0.3);
`

const StyledTextField = styled(TextField)`
  margin-bottom: 16px;
  
  .MuiOutlinedInput-root {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    color: #fff;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    &.Mui-focused {
      background: rgba(255, 255, 255, 0.05);
    }
    
    fieldset {
      border-color: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    
    &:hover fieldset {
      border-color: rgba(99, 102, 241, 0.5);
    }
    
    &.Mui-focused fieldset {
      border-color: #6366f1;
      border-width: 2px;
    }
  }
  
  .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.5);
    
    &.Mui-focused {
      color: #6366f1;
    }
  }
  
  .MuiInputAdornment-root {
    color: rgba(255, 255, 255, 0.4);
  }
`

const StyledSelect = styled(FormControl)`
  margin-bottom: 16px;
  
  .MuiOutlinedInput-root {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    color: #fff;
    
    fieldset {
      border-color: rgba(255, 255, 255, 0.1);
    }
    
    &:hover fieldset {
      border-color: rgba(99, 102, 241, 0.5);
    }
    
    &.Mui-focused fieldset {
      border-color: #6366f1;
    }
  }
  
  .MuiInputLabel-root {
    color: rgba(255, 255, 255, 0.5);
    
    &.Mui-focused {
      color: #6366f1;
    }
  }
  
  .MuiSelect-icon {
    color: rgba(255, 255, 255, 0.4);
  }
`

const GradientButton = styled(Button)`
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: none;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  background-size: 200% 200%;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    animation: ${gradientMove} 2s ease infinite;
    box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
`

const StyledTabs = styled(Tabs)`
  margin-bottom: 24px;
  
  .MuiTabs-indicator {
    background: linear-gradient(90deg, #6366f1, #a855f7);
    height: 3px;
    border-radius: 3px;
  }
  
  .MuiTab-root {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
    text-transform: none;
    font-size: 1rem;
    
    &.Mui-selected {
      color: #fff;
    }
  }
`

export default function AuthPage() {
  const [tabValue, setTabValue] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  // Signup states
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupRole, setSignupRole] = useState('teacher')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  
  const { user, profile, loading: authLoading, signIn, signUp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (!authLoading && user && profile && !redirecting) {
      setRedirecting(true)
      if (profile.role === 'admin') {
        router.replace('/admin-dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [mounted, user, profile, authLoading, router, redirecting])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const { error } = await signIn(loginEmail, loginPassword)
      
      if (error) {
        setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        setRedirecting(true)
        setTimeout(() => {
          if (profile?.role === 'admin') {
            router.replace('/admin-dashboard')
          } else {
            router.replace('/')
          }
        }, 1000)
      }
    } catch (err) {
      setLoginError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupLoading(true)
    setSignupError('')
    setSignupSuccess(false)

    // 비밀번호 확인
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('비밀번호가 일치하지 않습니다.')
      setSignupLoading(false)
      return
    }

    // 비밀번호 길이 체크
    if (signupPassword.length < 6) {
      setSignupError('비밀번호는 6자 이상이어야 합니다.')
      setSignupLoading(false)
      return
    }

    try {
      // Admin API를 통해 회원가입 (이메일 확인 건너뛰기)
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          full_name: signupName,
          role: signupRole
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.includes('이미 등록된')) {
          setSignupError('이미 등록된 이메일입니다.')
        } else {
          setSignupError(result.error || '회원가입에 실패했습니다.')
        }
        return
      }

      setSignupSuccess(true)
      setSignupError('')
      
      // 입력 필드 초기화
      setSignupName('')
      setSignupEmail('')
      setSignupPassword('')
      setSignupConfirmPassword('')
      setSignupRole('teacher')
      
      // 3초 후 로그인 탭으로 이동
      setTimeout(() => {
        setTabValue(0)
        setSignupSuccess(false)
      }, 3000)

    } catch (err) {
      console.error('회원가입 예외:', err)
      setSignupError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setSignupLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return (
      <PageBackground>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </PageBackground>
    )
  }

  if (user && profile) {
    return <PageBackground />
  }

  return (
    <PageBackground>
      {/* Background Effects */}
      <GridPattern />
      <FloatingOrb size={400} top="-10%" left="-10%" delay={0} />
      <FloatingOrb size={300} top="60%" left="70%" delay={2} />
      <FloatingOrb size={200} top="30%" left="80%" delay={4} />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <AuthCard>
          {/* Logo */}
          <LogoSection>
            <LogoIcon>
              <AutoAwesomeIcon sx={{ fontSize: 32, color: 'white' }} />
            </LogoIcon>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white', 
                fontWeight: 700,
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              Teacher Analytics
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem'
              }}
            >
              AI 기반 수업 분석 플랫폼
            </Typography>
          </LogoSection>

          {/* Tabs */}
          <StyledTabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            variant="fullWidth"
          >
            <Tab label="로그인" />
            <Tab label="회원가입" />
          </StyledTabs>

          {/* Login Form */}
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLogin}>
              <StyledTextField
                fullWidth
                label="이메일"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loginLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <StyledTextField
                fullWidth
                label="비밀번호"
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loginLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {showLoginPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {loginError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    '& .MuiAlert-icon': { color: '#f87171' }
                  }}
                >
                  {loginError}
                </Alert>
              )}

              <GradientButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loginLoading}
                disableElevation
              >
                {loginLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  '로그인'
                )}
              </GradientButton>
            </Box>
          )}

          {/* Signup Form */}
          {tabValue === 1 && (
            <Box component="form" onSubmit={handleSignup}>
              {signupSuccess ? (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: '#86efac',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    '& .MuiAlert-icon': { color: '#4ade80' }
                  }}
                >
                  🎉 회원가입이 완료되었습니다! 로그인해주세요.
                </Alert>
              ) : (
                <>
                  <StyledTextField
                    fullWidth
                    label="이름"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={signupLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledTextField
                    fullWidth
                    label="이메일"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={signupLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledSelect fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>역할</InputLabel>
                    <Select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value)}
                      label="역할"
                      disabled={signupLoading}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: '#1a1a3e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            '& .MuiMenuItem-root': {
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' },
                              '&.Mui-selected': { bgcolor: 'rgba(99, 102, 241, 0.3)' }
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="teacher">👨‍🏫 선생님</MenuItem>
                      <MenuItem value="admin">🎓 관리자</MenuItem>
                    </Select>
                  </StyledSelect>
                  
                  <StyledTextField
                    fullWidth
                    label="비밀번호"
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={signupLoading}
                    helperText="6자 이상 입력해주세요"
                    FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            edge="end"
                            sx={{ color: 'rgba(255,255,255,0.4)' }}
                          >
                            {showSignupPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledTextField
                    fullWidth
                    label="비밀번호 확인"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    disabled={signupLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {signupError && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        '& .MuiAlert-icon': { color: '#f87171' }
                      }}
                    >
                      {signupError}
                    </Alert>
                  )}

                  <GradientButton
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={signupLoading}
                    disableElevation
                  >
                    {signupLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      '회원가입'
                    )}
                  </GradientButton>
                </>
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.3)',
                fontSize: '0.75rem'
              }}
            >
              © 2024 Teacher Analytics. All rights reserved.
            </Typography>
          </Box>
        </AuthCard>
      </Container>
    </PageBackground>
  )
}
