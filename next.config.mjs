/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  
  turbopack: {
    resolveAlias: {
      '.prisma/client/default': './node_modules/.prisma/client/default.js',
    },
  },
};

export default nextConfig;