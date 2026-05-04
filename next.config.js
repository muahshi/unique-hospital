/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Development mein disable rakhein
});

const nextConfig = {
  // Aapki existing next.config settings yaha rahengi
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);

