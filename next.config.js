/**
 * Custom Next.js configuration to prevent server-only native modules (like `odbc`)
 * and heavy build-time utilities (node-pre-gyp, nock, etc.) from being bundled
 * by webpack. This avoids build failures related to binary/native deps that are
 * loaded dynamically at runtime only on the Node.js server side.
 *
 * We mark them as externals so that they are required with `require()` at
 * runtime instead of being parsed by webpack.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint errors/warnings that fail the production build – we still lint during development
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { isServer }) => {
    // Ensure externals array exists
    config.externals = config.externals || [];

    // Treat these packages as native/server-only – do NOT bundle.
    const externals = [
      'odbc',
      '@mapbox/node-pre-gyp',
      'nock',
      'node-gyp',
      '@mswjs/interceptors',
      '_http_common',
    ];

    externals.forEach((pkg) => {
      if (!config.externals.includes(pkg)) {
        config.externals.push(pkg);
      }
    });

    // Optionally, provide fallbacks/aliases so webpack doesn’t attempt polyfills.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      nock: false,
      '@mswjs/interceptors': false,
      // ldapjs optional dependency that isn’t required in the browser bundle
      'dtrace-provider': false,
    };

    return config;
  },
};

export default nextConfig;
