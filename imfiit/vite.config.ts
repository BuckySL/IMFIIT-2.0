import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      process: "process/browser",
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['process']
  },
  server: {
    allowedHosts: [
      '70c17a64deb6.ngrok-free.app'
    ],
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          game: ['socket.io-client', 'zustand'],
          ocr: ['tesseract.js']
        }
      }
    },
    sourcemap: true,
    target: 'esnext'
  }
})