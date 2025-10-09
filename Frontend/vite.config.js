import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_URL || '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },

  server: {
    proxy: {
      '/users': ' http://127.0.0.1:8000 ',
      '/leave': ' http://127.0.0.1:8000',
      '/onboarding': ' http://127.0.0.1:8000',
      '/attendance': 'http://localhost:8000',
      '/expenses': 'http://localhost:8000',
      '/projects': 'http://localhost:8000',
      '/weekoffs': 'http://localhost:8000',
      '/locations': ' http://127.0.0.1:8000',
      '/calendar': ' http://127.0.0.1:8000',
      '/policies': ' http://127.0.0.1:8000',
    },
  },
 
});
