/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist", "pdf-lib"],
  },
};

module.exports = nextConfig;
