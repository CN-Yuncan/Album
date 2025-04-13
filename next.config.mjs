// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin'
import withBundleAnalyzer from '@next/bundle-analyzer'

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
        hostname: '*.yuncan.xyz',
      },
      // 如需通配符支持需使用Next.js 13.3+
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    swcFileReading: false,
    esmExternals: 'loose',
    // 开启现代浏览器优化
    legacyBrowsers: false,
    optimizeCss: true,
  },
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }
    return config
  }
}

const withNextIntl = createNextIntlPlugin('./i18n.ts')
const analyzedConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(baseConfig)

export default withNextIntl(analyzedConfig)