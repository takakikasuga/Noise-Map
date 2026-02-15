import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 内部パッケージのトランスパイル
  transpilePackages: ['@hikkoshimap/shared', '@hikkoshimap/ui'],
  // bundle-barrel-imports: recharts / react-leaflet のバレルインポートを最適化
  experimental: {
    optimizePackageImports: ['recharts', 'react-leaflet'],
  },
};

export default nextConfig;
