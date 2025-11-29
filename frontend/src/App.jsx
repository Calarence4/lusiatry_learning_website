import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import News from './pages/News';
import CheckIn from './pages/CheckIn';
import Questions from './pages/Questions'; // 新增引入

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/questions" element={<Questions />} /> {/* 新增路由 */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="*" element={<div className="text-center mt-20 text-slate-400">404 Not Found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;