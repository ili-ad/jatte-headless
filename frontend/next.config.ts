import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@iliad/stream-ui'],

  /** ⬇️  THIS LINE tells Next to continue even with ESLint errors */
  eslint: { ignoreDuringBuilds: true },

  webpack(cfg) {
    cfg.resolve ??= {};
    cfg.resolve.alias ??= {};
    cfg.resolve.alias['@iliad/stream-ui'] = path.resolve(
      __dirname,
      './stubs/stream-ui',
    );
    return cfg;
  },
};

export default nextConfig;
