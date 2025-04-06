import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tesseract: ['tesseract.js'],
          zxing: ['@zxing/browser', '@zxing/library']
        }
      }
    }
  },
  server: {
    port: 5173,
    hmr: true
  }
});