import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'web',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@spm': path.resolve(__dirname, 'src/spm'),
      '@tcf': path.resolve(__dirname, 'src/tcf'),
      '@topology': path.resolve(__dirname, 'src/topology'),
      '@collaboration': path.resolve(__dirname, 'src/collaboration'),
      '@visualization': path.resolve(__dirname, 'src/visualization')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});