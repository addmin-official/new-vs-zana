import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load from .env file
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_FIREBASE_');

  // Also check process.env (for CI)
  const getEnv = (key: string): string => {
    return process.env[key] || fileEnv[key] || '';
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          runtimeCaching: [
            {
              // Cache curriculum data (CacheFirst, 7 days)
              urlPattern: /^https?:\/\/.*\/api\/curriculum\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'curriculum-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache static assets (CacheFirst, 30 days)
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|woff2?|ttf)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets-cache',
                expiration: {
                  maxEntries: 150,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache API responses (NetworkFirst, 1 hour) - Exclude real-time chat, assessment, feedback, admin, and internal routes
              urlPattern: /^https?:\/\/.*\/api\/(?!chat|assessment|feedback|admin|internal).*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-responses-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60, // 1 hour
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      visualizer({
        filename: 'dist/client/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist/client',
      target: 'es2022',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase-vendor';
              if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
              if (id.includes('lucide-react')) return 'lucide-vendor';
            }

            // Application component chunks
            if (id.includes('/components/charts/')) {
              return 'charts';
            }
            if (id.includes('BookViewer')) {
              return 'books';
            }
            if (
              id.includes('Simulation') ||
              id.includes('VirtualScienceLab') ||
              id.includes('PracticeLab') ||
              id.includes('/labs/')
            ) {
              return 'labs';
            }
            if (
              id.includes('Dashboard') ||
              id.includes('ParentPortal') ||
              id.includes('ParentReport') ||
              id.includes('/analytics/')
            ) {
              return 'dashboards';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(getEnv('VITE_FIREBASE_PROJECT_ID')),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(getEnv('VITE_FIREBASE_APP_ID')),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(getEnv('VITE_FIREBASE_API_KEY')),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(getEnv('VITE_FIREBASE_AUTH_DOMAIN')),
      'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(getEnv('VITE_FIREBASE_DATABASE_ID')),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(getEnv('VITE_FIREBASE_STORAGE_BUCKET')),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID')),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(getEnv('VITE_FIREBASE_MEASUREMENT_ID')),
      'import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID': JSON.stringify(getEnv('VITE_FIREBASE_OAUTH_CLIENT_ID')),
      'import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY': JSON.stringify(getEnv('VITE_FIREBASE_RECAPTCHA_SITE_KEY')),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      ...(process.env.DISABLE_HMR === 'true' ? { ws: false as const } : {}),
    },
  };
});