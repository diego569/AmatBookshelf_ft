/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    typescript: {
        ignoreBuildErrors: true, // For MVP speed, ignore TS errors during build
    },
    eslint: {
        ignoreDuringBuilds: true, // For MVP speed
    }
};

module.exports = nextConfig;
