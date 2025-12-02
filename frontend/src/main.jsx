import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// React Query 客户端配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5分钟内数据视为新鲜
      gcTime: 10 * 60 * 1000,        // 缓存保留10分钟
      refetchOnWindowFocus: false,   // 窗口聚焦不重新请求
      retry: 1,                      // 失败重试1次
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
