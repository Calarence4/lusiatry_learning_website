import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import Questions from './pages/Questions';
import KnowledgeBase from './pages/KnowledgeBase';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Course from './pages/Course';

// 如果有 News 页面
// import News from './pages/News';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<News />} />
          <Route path="/course" element={<Course />} />
        </Routes>
      </Layout>
    </Router>
  );
}