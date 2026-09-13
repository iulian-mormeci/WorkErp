import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  experimental: {
    serverActions: {
      // Di default 1MB: troppo poco per gli upload via Server Action (es.
      // Documenti, Estrai menu) che accettano file fino a 100MB — vedi
      // lib/storage.ts (MAX_UPLOAD_BYTES).
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
