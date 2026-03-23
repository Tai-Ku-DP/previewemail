/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
};

if (process.env.NODE_ENV === 'production') {
  nextConfig.output = 'export';
}

export default nextConfig;