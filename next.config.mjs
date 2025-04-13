// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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
      // 安全建议：明确指定允许的域名而不是使用通配符
      // {
      //   protocol: 'https',
      //   hostname: 'example.com', 
      // },
    ],
  },
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }
    return config
  },
  experimental: {
    swcFileReading: false,
    esmExternals: 'loose',
  }
};

module.exports = withNextIntl(
    withBundleAnalyzer(
        process.env.ANALYZE === 'true'
            ? withBundleAnalyzer(baseConfig)
            : baseConfig
    )
);