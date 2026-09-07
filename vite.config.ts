import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const devProxyTarget = process.env.SIREN_DEV_PROXY_TARGET;
  const configuredBase = process.env.VITE_BASE_PATH?.trim() || '/';
  const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Local cross-repo integration only. Production deployments must use a
      // configured API origin/reverse proxy with its own CORS and auth policy.
      ...(devProxyTarget ? {
        proxy: {
          '/api': {
            target: devProxyTarget,
            changeOrigin: true,
          },
        },
      } : {}),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            icons: ['lucide-react'],
          },
        },
      },
    },
  };
});
