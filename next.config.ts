import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @excalidraw 和部分 ESM-only 包需要 Next.js 转译
  transpilePackages: ['@excalidraw/excalidraw'],

  // 允许从 gsyen-api (Cloud Run) 读图片资源（未来用）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.run.app' },
      { protocol: 'https', hostname: 'gsyen.com' },
    ],
  },
};

export default nextConfig;
