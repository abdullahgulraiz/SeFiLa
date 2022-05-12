/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  async rewrites() {
    return [
      {
        source: '/nvd-endpoint/:path*',
        destination: 'https://services.nvd.nist.gov/rest/json/cve/1.0/:path*',
      },
      {
        source: '/github-advisories-endpoint/:path*',
        destination: 'https://github.com/advisories/:path*',
      },
    ]
  },
}

module.exports = nextConfig
