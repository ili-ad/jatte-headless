// next.config.ts

// @ts-nocheck
import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
const path = require('path');

const nextConfig: NextConfig = {
  //transpilePackages: ['@iliad/stream-ui'],
  transpilePackages: [],
  eslint: { ignoreDuringBuilds: true },

  webpack(cfg: Configuration) {
    cfg.resolve ??= {};
    cfg.resolve.alias ??= {};

    /* ↓ cast so TS knows we’re on the object variant */
    // (cfg.resolve.alias as Record<string, string>)['@iliad/stream-ui'] =
    //   path.resolve(__dirname, '../libs/stream-ui/dist/index.browser.cjs');

    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      '@iliad/stream-ui': path.resolve(__dirname, './stubs/stream-ui'),
    };

    
    return cfg;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
