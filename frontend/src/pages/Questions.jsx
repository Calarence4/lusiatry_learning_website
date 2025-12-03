import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, Circle, MessageSquare, ArrowLeft, X, Link2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
// ============================================
// 【删除】删除以下这行
// ============================================
// import { MOCK_QUESTIONS } from '../data/mockDb';

// ============================================
// 【新增】引入 API
// ============================================
import { problemsApi, fileTreeApi } from '../api';
import { useToast } from '../components/Toast';

export default function Questions() {
  const toast = useToast();
  // ============================================
  // 【修改】questions 初始为空数组
  // ============================================
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('all');

  // ============================================
  // 【新增】新的状态变量
  // ============================================
  const [loading, setLoading] = useState(true);

  // 思路编辑模态框状态
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // 答案编辑模态框状态
  const [answerModalQuestion, setAnswerModalQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [savingAnswerText, setSavingAnswerText] = useState(false);

  // 展开的问题详情
  const [expandedId, setExpandedId] = useState(null);

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

  // 加载知识库笔记列表
  useEffect(() => {
    async function fetchNotes() {
      try {
        const tree = await fileTreeApi.getAll();
        // 递归获取所有笔记文件
        const allNotes = [];
        const extractNotes = (items, path = '') => {
          items.forEach(item => {
            const currentPath = path ? `${path}/${item.title}` : item.title;
            if (item.type === 'file') {
              allNotes.push({ ...item, path: currentPath });
            }
            if (item.children) {
              extractNotes(item.children, currentPath);
            }
          });
        };
        extractNotes(tree || []);
        setNotes(allNotes);
      } catch (err) {
        console.error('加载笔记列表失败:', err);
      }
    }
    fetchNotes();
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
      toast.error('操作失败: ' + err.message);
    }
  };

  // ============================================
  // 【修改】filteredQuestions 使用新字段
  // 有答案的问题视为已解决
  // ============================================
  const filteredQuestions = questions.filter(q => {
    const isSolved = q.is_solved || q.answer;
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !isSolved;
    if (filter === 'resolved') return isSolved;
    return true;
  });

  // ============================================
  // 【修改】unresolvedCount 使用新字段
  // 有答案的问题视为已解决
  // ============================================
  const unresolvedCount = questions.filter(q => !q.is_solved && !q.answer).length;
  const resolvedCount = questions.filter(q => q.is_solved || q.answer).length;

  // 打开答案编辑模态框
  const openAnswerModal = (question) => {
    setEditingQuestion(question);
    setSolutionText(question.solution || '');
    setSelectedNoteId(question.related_note_id || null);
    setShowNoteSelector(false);
  };

  // 关闭答案编辑模态框
  const closeAnswerModal = () => {
    setEditingQuestion(null);
    setSolutionText('');
    setSelectedNoteId(null);
    setShowNoteSelector(false);
  };

  // 保存答案
  const saveAnswer = async () => {
    if (!editingQuestion) return;
    
    setSavingAnswer(true);
    try {
      await problemsApi.update(editingQuestion.id, {
        solution: solutionText,
        related_note_id: selectedNoteId
      });
      
      // 更新本地状态
      setQuestions(questions.map(q =>
        q.id === editingQuestion.id
          ? { ...q, solution: solutionText, related_note_id: selectedNoteId }
          : q
      ));
      
      closeAnswerModal();
      toast.success('保存成功');
    } catch (err) {
      console.error('保存答案失败:', err);
      toast.error('保存失败: ' + err.message);
    } finally {
      setSavingAnswer(false);
    }
  };

  // 获取关联笔记名称
  const getNoteName = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    return note ? note.path : null;
  };

  // 切换展开/收起
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 打开答案模态框
  const openAnswerTextModal = (question) => {
    setAnswerModalQuestion(question);
    setAnswerText(question.answer || '');
  };

  // 关闭答案模态框
  const closeAnswerTextModal = () => {
    setAnswerModalQuestion(null);
    setAnswerText('');
  };

  // 保存答案
  const saveAnswerText = async () => {
    if (!answerModalQuestion) return;
    
    setSavingAnswerText(true);
    try {
      await problemsApi.update(answerModalQuestion.id, {
        answer: answerText
      });
      
      // 更新本地状态
      setQuestions(questions.map(q =>
        q.id === answerModalQuestion.id
          ? { ...q, answer: answerText }
          : q
      ));
      
      closeAnswerTextModal();
      toast.success('保存成功');
    } catch (err) {
      console.error('保存答案失败:', err);
      toast.error('保存失败: ' + err.message);
    } finally {
      setSavingAnswerText(false);
    }
  };

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
                {f === 'resolved' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${filter === f ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-500'}`}>
                    {resolvedCount}
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

            {filteredQuestions.map(q => {
              const isSolved = q.is_solved || q.answer;
              return (
              <div
                key={q.id}
                className={`bg-white/60 backdrop-blur-md p-6 rounded-2xl border transition-all group ${isSolved ? 'border-white/40 opacity-70' : 'border-white/60 shadow-sm hover:border-red-200/50 hover:shadow-md hover:bg-white/80'}`}
              >
                <div className="flex items-start gap-4">
                  {/* 状态图标：有答案的不显示圆圈按钮 */}
                  {q.answer ? (
                    <div className="mt-1">
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    </div>
                  ) : (
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
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-slate-500 bg-white/50 border border-white/50 px-2 py-1 rounded uppercase tracking-wider">
                        {q.subject_name || 'General'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {q.date ? new Date(q.date).toLocaleDateString() : ''}
                      </span>
                      {q.answer && (
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">
                          已解答
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isSolved ? 'text-slate-500' : 'text-slate-800'}`}>
                      {q.problem}
                    </h3>
                    
                    {/* 已完成问题直接显示答案 */}
                    {q.answer && (
                      <div className="mt-2 text-sm text-slate-600 bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-lg">
                        <div className="text-xs font-bold text-emerald-600 mb-1">答案</div>
                        <p className="whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    )}

                    {q.content && (
                      <p className="text-sm text-slate-600 mb-3">
                        {q.content}
                      </p>
                    )}

                    {/* 已有思路/关联笔记展示 */}
                    {(q.solution || q.related_note_id) && (
                      <div className="mt-3">
                        <button 
                          onClick={() => toggleExpand(q.id)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          {expandedId === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {q.solution ? '查看解决思路' : '查看关联笔记'}
                        </button>
                        
                        {expandedId === q.id && (
                          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            {q.solution && (
                              <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-lg text-sm text-slate-700">
                                <div className="text-xs font-bold text-slate-400 mb-1">解决思路</div>
                                <p className="whitespace-pre-wrap">{q.solution}</p>
                              </div>
                            )}
                            {q.related_note_id && (
                              <div className="bg-indigo-50/80 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-700 flex items-center gap-2">
                                <Link2 size={14} />
                                <span>关联笔记：</span>
                                <Link 
                                  to={`/knowledge-base?file=${q.related_note_id}`}
                                  className="font-medium hover:underline"
                                >
                                  {getNoteName(q.related_note_id) || '查看笔记'}
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => openAnswerTextModal(q)}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle2 size={12} /> {q.answer ? '编辑答案' : '添加答案'}
                      </button>
                      <button 
                        onClick={() => openAnswerModal(q)}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        <MessageSquare size={12} /> {q.solution ? '编辑思路' : '添加思路'}
                      </button>
                      {!q.related_note_id && (
                        <button 
                          onClick={() => openAnswerModal(q)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                        >
                          <Link2 size={12} /> 关联笔记
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 思路编辑模态框 */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAnswerModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={closeAnswerModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">添加解决思路</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{editingQuestion.problem}</p>
            
            {/* 解决思路输入 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                解决思路
              </label>
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="记录你的解题思路、方法或心得..."
                className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            
            {/* 关联知识库笔记 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Link2 size={14} className="inline mr-1" />
                关联知识库笔记（可选）
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowNoteSelector(!showNoteSelector)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-left text-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  {selectedNoteId ? (
                    <span className="text-slate-700 flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500" />
                      {getNoteName(selectedNoteId)}
                    </span>
                  ) : (
                    <span className="text-slate-400">选择一篇笔记...</span>
                  )}
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showNoteSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {showNoteSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    <div 
                      onClick={() => { setSelectedNoteId(null); setShowNoteSelector(false); }}
                      className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 cursor-pointer"
                    >
                      不关联笔记
                    </div>
                    {notes.map(note => (
                      <div
                        key={note.id}
                        onClick={() => { setSelectedNoteId(note.id); setShowNoteSelector(false); }}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                          selectedNoteId === note.id 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{note.path}</span>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div className="px-3 py-4 text-sm text-center">
                        <p className="text-slate-400">暂无可关联的笔记</p>
                        <Link to="/knowledge" className="text-indigo-500 hover:text-indigo-600 text-xs mt-1 inline-block">
                          前往知识库创建笔记 →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={closeAnswerModal}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={saveAnswer}
                disabled={savingAnswer}
                className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {savingAnswer ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 答案编辑模态框 */}
      {answerModalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAnswerTextModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={closeAnswerTextModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              <CheckCircle2 size={18} className="inline mr-2 text-emerald-500" />
              添加答案
            </h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{answerModalQuestion.problem}</p>
            
            {/* 答案输入 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                问题答案
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="输入问题的正确答案..."
                className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">添加答案后，该问题将自动标记为已解决</p>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={closeAnswerTextModal}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={saveAnswerText}
                disabled={savingAnswerText}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {savingAnswerText ? '保存中...' : '保存答案'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}