/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Don't break the production build on lint warnings.
  eslint: { ignoreDuringBuilds: true },
  // We type-check in dev; on Vercel skip strict TS to avoid surprise blocks.
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer }) => {
    // @imgly/background-removal references these only via dynamic checks —
    // alias them to false so webpack doesn't try to bundle native deps.
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };

    // WASM only loads in the browser — keep experiments off the server build.
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        layers: true,
      };
    }

    return config;
  },
};

export default nextConfig;
