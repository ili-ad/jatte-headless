//frontend/next.config.ts

// @ts-nocheck
import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';
const path = require('path');

const nextConfig: NextConfig = {
  //transpilePackages: ['@iliad/stream-ui'],
  transpilePackages: [],
  eslint: { ignoreDuringBuilds: true },
  // avoid redirecting away from trailing slashes so Django endpoints work
  skipTrailingSlashRedirect: true,
  trailingSlash: false,


webpack(cfg) {
  cfg.resolve ??= {};
  cfg.resolve.alias ??= {};

  // existing aliases … -------------------------------------------------
  // (cfg.resolve.alias as Record<string,string>)['@iliad/stream-ui'] =
  //   path.resolve(__dirname, './stubs/stream-ui');

  // WITH the real kit ⬇︎
  (cfg.resolve.alias as any)['@iliad/stream-ui'] = 'stream-chat-react';

  (cfg.resolve.alias as Record<string,string>)['stream-chat'] =
    path.resolve(__dirname, '../libs/chat-shim');

  (cfg.resolve.alias as Record<string,string>)['stream-value-checks'] =
    path.resolve(__dirname, '../libs/stream-value-shim');    

  // NEW ↓ – lets you write  "@/lib/ChatProvider"  etc.
  (cfg.resolve.alias as Record<string,string>)['@'] =
    path.resolve(__dirname);

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
