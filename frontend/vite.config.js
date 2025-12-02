import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 构建优化
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将第三方库分离到不同的 chunk
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
    // 分块大小警告阈值
    chunkSizeWarningLimit: 500,
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})