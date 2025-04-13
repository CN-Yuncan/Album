// next.config.mjs
import { fileURLToPath } from 'node:url'
import createNextIntlPlugin from 'next-intl/plugin'
import withBundleAnalyzer from '@next/bundle-analyzer'

const __filename = fileURLToPath(import.meta.url) // 修复ESM下的路径问题

/** @type {import('next').NextConfig} */
const baseConfig = {
  output: "standalone",
  reactStrictMode: true,
  compiler: {
    removeConsole: {
      exclude: ['error'],
    },
  },
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
        hostname: 'apir.yuncan.xyz',
      },
      {
        protocol: 'https',
        hostname: '**', // 需要Next.js 13.3+
      },
    ],
  },
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename], // 使用修正后的路径
      },
    }
    return config
  },
  experimental: {
    esmExternals: 'loose',
    swcFileReading: false,
  }
}

const withNextIntl = createNextIntlPlugin('./i18n.ts')
const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(baseConfig)

export default withNextIntl(analyzedConfig)