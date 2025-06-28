// frontend/next.config.ts
import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },

  webpack(cfg) {
    cfg.resolve ??= {};
    cfg.resolve.alias ??= {};

    // our chat fork
    cfg.resolve.alias['stream-chat-react'] =
      path.resolve(__dirname, '../libs/stream-chat-shim');
    cfg.resolve.alias['@iliad/stream-chat-shim'] =
      path.resolve(__dirname, '../libs/stream-chat-shim');

    // backend stub
    cfg.resolve.alias['chat-shim'] =
      path.resolve(__dirname, '../libs/chat-shim');

    // ← NEW: point every import of decode-named... to our shim
    cfg.resolve.alias['decode-named-character-reference'] =
      path.resolve(__dirname, './shims/decode-named-character-reference.js');

    // don’t let Webpack follow symlinks back into node_modules
    cfg.resolve.symlinks = false;

    return cfg;
  },

  // next.config.ts
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',   // keeps the slash
      },
    ];
  },


};



export default nextConfig;
