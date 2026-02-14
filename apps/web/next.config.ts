import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 内部パッケージのトランスパイル
  transpilePackages: ['@hikkoshinoise/shared', '@hikkoshinoise/ui'],
};

export default nextConfig;
