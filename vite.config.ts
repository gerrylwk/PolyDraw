import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  worker: {
    format: 'es',
  },
  // Configuration for remote server deployment
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: true,
    allowedHosts: true, // Allow all hosts for development
  },
  preview: {
    host: '0.0.0.0', // Allow external connections for preview mode
    port: 4173,
    strictPort: true,
    allowedHosts: true, // Allow all hosts for preview mode
  },
  // Ensure assets are referenced correctly regardless of deployment path
  base: './',
});
