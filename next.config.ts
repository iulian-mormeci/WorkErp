import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  // In produzione davanti c'è nginx (vedi docker-compose.prod.yml), che non
  // aggiunge header di sicurezza: li mette l'app, così valgono con qualunque
  // proxy. HSTS è ignorato dai browser su HTTP, quindi innocuo in sviluppo.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
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
