/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  serverExternalPackages: [
    "@tailwindcss/oxide-win32-x64-msvc",
    "lightningcss-win32-x64-msvc",
    "bcrypt",
  ],
};

export default nextConfig;
