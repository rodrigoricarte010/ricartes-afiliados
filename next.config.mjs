/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // O preview roda atrás de um proxy (https://<porta>-<sandbox>.e2b.app).
  // Não restringimos origens para que Server Actions funcionem nesse host.
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
