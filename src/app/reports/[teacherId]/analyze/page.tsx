'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  Container, 
  Box, 
  Typography, 
  LinearProgress, 
  Paper,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MovieIcon from '@mui/icons-material/Movie';
import styled from '@emotion/styled';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

const UploadContainer = styled(motion.div)`
  background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18);
  padding: 2rem;
  text-align: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const DropZone = styled.div`
  border: 2px dashed #4A90E2;
  border-radius: 15px;
  padding: 3rem;
  background: rgba(255,255,255,0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(74,144,226,0.1);
    border-color: #2171D1;
    transform: scale(1.02);
  }
`;

export default function AnalyzePage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const pathname = usePathname();
  const teacherId = pathname.split('/')[2];
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setStatusMessage(null);
    
    try {
      // 1단계: 업로드 초기화
      setUploadProgress(5);
      setStatusMessage('업로드 초기화 중...');
      
      const startRes = await fetch('/api/analyze/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          teacherId: teacherId,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          lessonDate: new Date().toISOString().split('T')[0],
          fileSize: selectedFile.size,
        }),
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || '초기화 실패');
      }

      const { reportId, videoPath, token } = await startRes.json();

      // 2단계: Supabase Storage에 영상 업로드
      setUploadProgress(10);
      setStatusMessage('영상 업로드 중...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: uploadError } = await supabaseClient.storage
        .from('videos')
        .uploadToSignedUrl(videoPath, token, selectedFile, { upsert: true });

      if (uploadError) throw new Error(`영상 업로드 실패: ${uploadError.message}`);

      setUploadProgress(30);

      // 3단계: 트랜스크립션 시작
      setStatusMessage('음성 인식 시작 중...');
      
      const transcribeRes = await fetch('/api/analyze/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath, reportId }),
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || '트랜스크립션 시작 실패');
      }

      const { transcriptId: tId } = await transcribeRes.json();
      setTranscriptId(tId);
      setUploadProgress(40);

      // 4단계: 트랜스크립션 완료 대기 (폴링)
      setStatusMessage('음성 인식 처리 중...');
      
      let transcriptStatus = 'processing';
      while (transcriptStatus !== 'completed' && transcriptStatus !== 'error') {
        await new Promise(r => setTimeout(r, 3000));
        
        const statusRes = await fetch(`/api/analyze/status?transcriptId=${tId}`);
        const statusData = await statusRes.json();
        
        transcriptStatus = statusData.status;
        setUploadProgress(Math.min(statusData.progress || 40, 65));
        if (statusData.step) setStatusMessage(statusData.step);
        
        if (transcriptStatus === 'error') {
          throw new Error(statusData.error || '음성 인식 중 오류');
        }
      }

      // 5단계: GPT 분석
      setUploadProgress(70);
      setStatusMessage('AI 분석 중...');
      
      const completeRes = await fetch('/api/analyze/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId: tId,
          reportId,
          teacherId: teacherId,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          lessonDate: new Date().toISOString().split('T')[0],
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || 'AI 분석 실패');
      }

      setUploadProgress(100);
      setStatusMessage('분석 완료!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/reports/${teacherId}/${reportId}`);

    } catch (error) {
      console.error('업로드 오류:', error);
      setError(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
      setUploading(false);
    }
  };

  return (
    <Container 
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <UploadContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            className="font-sogang"
            sx={{ 
              color: '#2C3E50',
              mb: 4,
              fontWeight: 'bold'
            }}
          >
            수업 영상 업로드
          </Typography>
        </motion.div>

        <DropZone {...getRootProps()}>
          <input {...getInputProps()} />
          <motion.div
            animate={{
              y: isDragActive ? -10 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <CloudUploadIcon sx={{ fontSize: 60, color: '#4A90E2', mb: 2 }} />
            <Typography variant="h6" gutterBottom className="font-sogang">
              {isDragActive ? 
                '여기에 놓아주세요!' : 
                '영상을 드래그하거나 클릭하여 업로드하세요'}
            </Typography>
            <Typography variant="body2" color="textSecondary" className="font-sogang">
              지원 형식: MP4, MOV, AVI
            </Typography>
          </motion.div>
        </DropZone>

        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                mt: 3, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                background: 'rgba(255,255,255,0.9)'
              }}
            >
              <MovieIcon color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" className="font-sogang">
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" className="font-sogang">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
            </Paper>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading}
                sx={{ 
                  mt: 3,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  color: 'white',
                  padding: '10px 30px',
                }}
                className="font-sogang"
              >
                {uploading ? '업로드 중...' : '분석 시작하기'}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: '2rem' }}
          >
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                }
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ mt: 1 }}
              className="font-sogang"
            >
              {uploadProgress}% 완료
            </Typography>
          </motion.div>
        )}
      </UploadContainer>
    </Container>
  );
} 