// next.config.mjs
import { fileURLToPath } from 'node:url'
import createNextIntlPlugin from 'next-intl/plugin'
import withBundleAnalyzer from '@next/bundle-analyzer'

const __filename = fileURLToPath(import.meta.url)

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production',
  output: "standalone",
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
  headers: async () => [
    {
      source: '/fonts/:font*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ],
  serverExternalPackages: ['pg'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.yuncan.xyz',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      version: process.env.CACHE_VERSION || 'v1',
    }
    return config
  },
  experimental: {
    // 保留推荐使用的优化选项
    optimizeCss: false,
    legacyBrowsers: false,
    // 已移除不推荐配置
  }
}

// 插件链式调用
const withNextIntl = createNextIntlPlugin('./i18n.ts')
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withNextIntl(withAnalyzer(baseConfig))