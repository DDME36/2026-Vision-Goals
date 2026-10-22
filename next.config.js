/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  // Minimal self-contained server for the Docker image.
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // The migrator reads SQL files from /drizzle at runtime.
  outputFileTracingIncludes: {
    '/**': ['./drizzle/**/*'],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/api/(.*)', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ]
  },
}

module.exports = nextConfig
