/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: './dist',
  turbopack: {
    root: import.meta.dirname,
  },
};

if (process.env.NODE_ENV === 'production') {
  nextConfig.output = 'export'; // Outputs a Single-Page Application (SPA) only on build.
}

export default nextConfig;
