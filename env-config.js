// Set environment variables for Next.js
module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    PORT: 3000,
    HOST: 'localhost'
  },
};
