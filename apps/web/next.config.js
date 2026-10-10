/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone is for Docker/EC2; Vercel uses its own output handling.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
