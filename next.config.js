/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // canvas is an optional peer dep of pdfjs-dist for Node.js server-side
    // rendering — alias it to false so webpack doesn't try to bundle it for
    // the browser.
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
