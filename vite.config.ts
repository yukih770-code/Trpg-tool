import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

function localRuntimeDiagnosticsPlugin(authMode: 'localDev' | 'privateAlpha'): Plugin {
  return {
    name: 'trpg-local-runtime-diagnostics',
    configureServer(server) {
      server.middlewares.use('/__trpg_dev_runtime', (_request, response) => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify({ service: 'vite-dev', authMode }));
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const privateAlphaEnabled = process.env.VITE_PRIVATE_ALPHA_AUTH_ENABLED ?? env.VITE_PRIVATE_ALPHA_AUTH_ENABLED;
  const authMode = privateAlphaEnabled === 'true' ? 'privateAlpha' : 'localDev';
  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), localRuntimeDiagnosticsPlugin(authMode)],
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
