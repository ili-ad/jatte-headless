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
  /* 1 ▸ All UI imports go to the new shim barrel */

  /* NEW – allow deep asset paths to fall back to the real package */
  cfg.resolve.alias['stream-chat-react/dist'] =
    path.resolve(__dirname, '../node_modules/stream-chat-react/dist');

  cfg.resolve.alias['stream-chat-react'] =
    path.resolve(__dirname, '../libs/stream-chat-shim/src');

  (cfg.resolve.alias as Record<string,string>)['stream-chat'] =
    path.resolve(__dirname, '../libs/chat-shim');
    
  // NEW ↓ – lets you write  "@/lib/ChatProvider"  etc.
  (cfg.resolve.alias as Record<string,string>)['@'] =
  path.resolve(__dirname);

  (cfg.resolve.alias as Record<string,string>)['stream-value-checks'] =
    path.resolve(__dirname, '../libs/stream-value-shim');    
    
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
