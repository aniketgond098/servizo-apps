import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
          output: {
              manualChunks(id) {
                if (id.includes('node_modules')) {
                  if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
                  if (id.includes('firebase')) return 'firebase-vendor';
                  if (id.includes('leaflet')) return 'map-vendor';
                  if (id.includes('react-easy-crop')) return 'crop-vendor';
                  if (id.includes('@google/genai')) return 'ai-vendor';
                  if (id.includes('lucide-react')) return 'ui-vendor';
                }
              }
          }
        },
        chunkSizeWarningLimit: 1000,
      },
      optimizeDeps: {
        include: [
          'react', 'react-dom', 'react-router-dom',
          'firebase/app', 'firebase/firestore', 'firebase/auth',
          'lucide-react',
        ],
        esbuildOptions: {
          treeShaking: true,
          target: 'es2020',
        },
      },
    };
});