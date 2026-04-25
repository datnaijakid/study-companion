/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Prisma/Database needs to be externalized
  serverExternalPackages: ['@prisma/client', 'pg'],

  // 2. The NEW way to configure Turbopack in v16
  turbopack: {
    resolveAlias: {
      '.prisma/client/default': './node_modules/.prisma/client/default.js',
    },
  },
};

export default nextConfig;