/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: import.meta.dirname,
  },
};

if (process.env.NODE_ENV === "production") {
  nextConfig.output = "export";
}

export default nextConfig;
