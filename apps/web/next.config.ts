import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  // 末尾スラッシュなし（正規URL統一）
  trailingSlash: false,
  // 内部パッケージのトランスパイル
  transpilePackages: ['@hikkoshimap/shared', '@hikkoshimap/ui'],
  // bundle-barrel-imports: recharts / react-leaflet のバレルインポートを最適化
  experimental: {
    optimizePackageImports: ['recharts', 'react-leaflet'],
  },
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
