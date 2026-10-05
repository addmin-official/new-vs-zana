import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load from .env file
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_FIREBASE_');

  // Also check process.env (for CI)
  const getEnv = (key: string): string => {
    return process.env[key] || fileEnv[key] || '';
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist/client',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'markdown-vendor': ['react-markdown'],
          },
        },
      },
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
    },
  };
});