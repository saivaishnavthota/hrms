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
      '/users': 'http://127.0.0.1:2343',
      '/leave': 'http://127.0.0.1:2343',
      '/onboarding': 'http://127.0.0.1:2343',
      '/attendance': 'http://127.0.0.1:2343',
      '/expenses': 'http://127.0.0.1:2343',
      '/projects': 'http://127.0.0.1:2343',
      '/weekoffs': 'http://127.0.0.1:2343',
      '/locations': 'http://127.0.0.1:2343',
      '/calendar': 'http://127.0.0.1:2343',
      '/policies': 'http://127.0.0.1:2343',
      '/auth': 'http://127.0.0.1:2343',  // Entra ID authentication
      '/oauth2': 'http://127.0.0.1:2343',  // Azure AD OAuth2 redirect
      '/api': 'http://127.0.0.1:2343',   // Assets & other API routes
      '/software_requests': 'http://127.0.0.1:2343',  // Software requests
      '/assets': 'http://127.0.0.1:2343', // Asset endpoints
    },
  },
 
});
