import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 영상 업로드를 위한 body 크기 제한 증가
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // FFmpeg 패키지를 외부로 처리
  serverExternalPackages: ['@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg'],
};

export default nextConfig;
