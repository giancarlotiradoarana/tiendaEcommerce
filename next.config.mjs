/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Evita fallos en "Collecting build traces" excluyendo binarios pesados
  // que solo se usan en tiempo de ejecución.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/**",
      "node_modules/sharp/**",
    ],
  },
  eslint: {
    // No frenar el build por warnings de lint en producción
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
