/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@projectuk/shared', '@projectuk/api-client']
};

module.exports = nextConfig;

