/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from the client-side bundle
    if (!isServer) {
      // These modules are server-side only and shouldn't be bundled for the client
      config.resolve.fallback = {
        ...config.resolve.fallback, // Keep existing fallbacks
        'odbc': false, // Provide an empty module for odbc on the client
        'mssql': false, // Provide an empty module for mssql on the client
        'nock': false, // Provide an empty module for nock on the client
        'fs': false,   // Provide an empty module for fs on the client
        // Add any other server-only modules causing issues here
      };
    }

    // Important: return the modified config
    return config;
  },
  experimental: {
    // Add packages here that should not be bundled by Next.js during server-side builds.
    // This is often necessary for packages with native bindings like 'odbc'.
    serverComponentsExternalPackages: ['odbc'],
  },
  // Add other Next.js configurations here if needed
};

export default nextConfig; // Use ESM export syntax
