import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';

// 懒加载页面组件 - 性能优化
const Home = lazy(() => import('./pages/Home'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const Questions = lazy(() => import('./pages/Questions'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase/index'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const News = lazy(() => import('./pages/News'));
const Course = lazy(() => import('./pages/Course'));

// 加载状态组件
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50/40">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-3 border-slate-200 border-t-indigo-500" />
      <span className="text-sm text-slate-400">加载中...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/course" element={<Course />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ToastProvider>
  );
}