/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 画像は Wikimedia の外部URLを <img> でそのまま表示（オフラインSWでキャッシュ可能にするため最適化を通さない）。
}

export default nextConfig
