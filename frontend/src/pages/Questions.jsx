import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, Circle, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
// ============================================
// 【删除】删除以下这行
// ============================================
// import { MOCK_QUESTIONS } from '../data/mockDb';

// ============================================
// 【新增】引入 API
// ============================================
import { problemsApi } from '../api';

export default function Questions() {
  // ============================================
  // 【修改】questions 初始为空数组
  // ============================================
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');

  // ============================================
  // 【新增】新的状态变量
  // ============================================
  const [loading, setLoading] = useState(true);

  // ============================================
  // 【新增】加载数据
  // ============================================
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await problemsApi.getAll();
        setQuestions(data || []);
      } catch (err) {
        console.error('加载问题列表失败:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // ============================================
  // 【修改】toggleStatus 调用 API
  // ============================================
  const toggleStatus = async (id) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    try {
      if (question.is_solved) {
        await problemsApi.unsolve(id);
      } else {
        await problemsApi.solve(id);
      }

      setQuestions(questions.map(q =>
        q.id === id
          ? { ...q, is_solved: !q.is_solved }
          : q
      ));
    } catch (err) {
      console.error('切换状态失败:', err);
      alert('操作失败: ' + err.message);
    }
  };

  // ============================================
  // 【修改】filteredQuestions 使用新字段
  // ============================================
  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !q.is_solved;
    if (filter === 'resolved') return q.is_solved;
    return true;
  });

  // ============================================
  // 【修改】unresolvedCount 使用新字段
  // ============================================
  const unresolvedCount = questions.filter(q => !q.is_solved).length;

  // ============================================
  // 【新增】加载状态
  // ============================================
  if (loading) {
    return (
      <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
        <div className="fixed inset-0 z-0 bg-slate-50/40"></div>
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
      {/* 1. 固定背景 */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
      <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

      {/* 2. 头部导航 */}
      <div className="relative z-10 flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">问题集</h1>
        </div>
      </div>

      {/* 3. 主要内容 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* 页面 Header */}
        <div className="flex justify-between items-end border-b border-slate-200/50 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 drop-shadow-sm">
              <HelpCircle className="text-red-500" size={32} /> 问题集
            </h1>
            <p className="text-slate-600 mt-2 font-medium">记录困惑，追踪答案，彻底搞懂每一个知识点。</p>
          </div>
          <div className="text-right bg-white/40 p-3 rounded-xl backdrop-blur-sm border border-white/40">
            <div className="text-3xl font-bold text-slate-800">{unresolvedCount}</div>
            <div className="text-xs font-bold text-red-500 uppercase tracking-wider">Pending Issues</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧筛选 */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Filter View</div>
            {['all', 'unresolved', 'resolved'].map(f => (
              <div
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border ${filter === f
                  ? 'bg-slate-900/90 backdrop-blur-xl text-white shadow-lg border-slate-700'
                  : 'text-slate-600 hover:bg-white/50 border-transparent hover:border-white/40'
                  }`}
              >
                <span className="capitalize font-medium">{f}</span>
                {f === 'unresolved' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${filter === f ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'}`}>
                    {unresolvedCount}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 右侧列表 */}
          <div className="lg:col-span-3 space-y-4">
            {filteredQuestions.length === 0 && (
              <div className="text-center py-20 text-slate-400 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-white/60 flex flex-col items-center justify-center">
                <HelpCircle size={48} className="mb-4 opacity-20" />
                <span>没有找到相关问题</span>
              </div>
            )}

            {filteredQuestions.map(q => (
              <div
                key={q.id}
                className={`bg-white/60 backdrop-blur-md p-6 rounded-2xl border transition-all group ${q.is_solved ? 'border-white/40 opacity-60 grayscale-[0.5]' : 'border-white/60 shadow-sm hover:border-red-200/50 hover:shadow-md hover:bg-white/80'}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => toggleStatus(q.id)}
                    className="mt-1 cursor-pointer hover:scale-110 transition-transform"
                    title={q.is_solved ? "标记为未解决" : "标记为已解决"}
                  >
                    {q.is_solved
                      ? <CheckCircle2 className="text-emerald-500" size={24} />
                      : <Circle className="text-slate-400 hover:text-red-400" size={24} />
                    }
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-slate-500 bg-white/50 border border-white/50 px-2 py-1 rounded uppercase tracking-wider">
                        {q.subject_name || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {q.date ? new Date(q.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${q.is_solved ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {q.problem}
                    </h3>
                    {q.content && (
                      <p className="text-sm text-slate-600 mb-3">
                        {q.content}
                      </p>
                    )}
                    {q.is_solved && q.related_draft_id && (
                      <div className="bg-emerald-50/60 border border-emerald-100/50 p-3 rounded-lg text-sm text-emerald-800 mt-3 flex gap-2">
                        <CheckCircle2 size={16} className="mt-0. 5 shrink-0" />
                        <div>已关联草稿笔记</div>
                      </div>
                    )}
                    {!q.is_solved && (
                      <div className="mt-3 flex gap-2">
                        <button className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                          <MessageSquare size={12} /> 添加解决思路
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}