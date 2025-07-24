/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    PROJECT_ROOT: __dirname,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    PORT: 5500,
    HOST: 'localhost'
  },
  webpack: (config, { isServer }) => {
    // Only include the better-sqlite3 module on the server-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        'better-sqlite3': false,
        'mock-aws-s3': false,
        'aws-sdk': false,
        'nock': false,
        'odbc': false,
      };
    }
    
    // Handle better-sqlite3 module
    config.externals = [
      ...config.externals || [], 
      'better-sqlite3',
      { 'mock-aws-s3': 'commonjs mock-aws-s3' },
      { 'aws-sdk': 'commonjs aws-sdk' },
      { 'nock': 'commonjs nock' },
      { 'odbc': 'commonjs odbc' }
    ];
    
    // Exclude .cs files from being processed by webpack
    config.module.rules.push({
      test: /\.cs$/,
      loader: 'ignore-loader',
    });
    
    return config;
  },
};

module.exports = nextConfig;
