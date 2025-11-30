import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, PenLine, Save, HelpCircle, FileText, Folder, ChevronDown } from 'lucide-react';
import { draftsApi, problemsApi, subjectsApi, studyTimeApi } from '../api';

export default function LearningRecorder() {
    const [subjects, setSubjects] = useState([]);
    const [pendingDraftsCount, setPendingDraftsCount] = useState(0);
    const [unresolvedCount, setUnresolvedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [subjectId, setSubjectId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [recordType, setRecordType] = useState('note');
    const [subject, setSubject] = useState('');
    const [duration, setDuration] = useState('');
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [baseHeight, setBaseHeight] = useState(0);
    const dropdownRef = useRef(null);
    const cardRef = useRef(null);

    // 初次渲染后记录收起状态的高度
    useEffect(() => {
        if (cardRef.current && !loading && baseHeight === 0) {
            setBaseHeight(cardRef.current.offsetHeight);
        }
    }, [loading, baseHeight]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [subjectsData, draftsData, problemsData] = await Promise.all([
                    subjectsApi.getAll(),
                    draftsApi.getAll({ status: 'pending' }),
                    problemsApi.getAll({ status: '0' })
                ]);
                setSubjects(subjectsData || []);
                setPendingDraftsCount(draftsData?.length || 0);
                setUnresolvedCount(problemsData?.length || 0);
            } catch (err) {
                console.error('加载数据失败:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSuggestion = (subjectItem) => {
        setSubject(subjectItem.path || subjectItem.title);
        setSubjectId(subjectItem.id);
        setShowSuggestions(false);
    };

    const handleSave = async () => {
        if (!content && !subject) return;

        try {
            setSaving(true);

            if (recordType === 'note') {
                await draftsApi.create({
                    title: subject ? `${subject.split(' > ').pop()} 笔记` : '未命名记录',
                    subject: subjectId,
                    content: content,
                    tags: []
                });

                if (duration && parseInt(duration) > 0) {
                    await studyTimeApi.create({
                        log_date: new Date().toISOString().split('T')[0],
                        subject: subjectId,
                        duration: parseInt(duration)
                    });
                }

                setPendingDraftsCount(prev => prev + 1);
                alert("已保存至笔记草稿箱");
            } else {
                await problemsApi.create({
                    problem: content,
                    content: '',
                    subject: subjectId,
                    source: ''
                });
                setUnresolvedCount(prev => prev + 1);
                alert("已录入问题集，待解决");
            }

            setContent('');
            setDuration('');
            setSubject('');
            setSubjectId(null);
            setIsExpanded(false);
            setShowSuggestions(false);

        } catch (err) {
            console.error('保存失败:', err);
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/60 rounded-2xl p-5 shadow-sm border border-white/60 h-fit">
                <div className="animate-pulse space-y-3">
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        // 外层容器：固定高度，作为定位参照
        <div
            className="relative"
            style={{ height: baseHeight > 0 ? baseHeight : 'auto' }}
        >
            {/* 卡片主体：absolute + bottom-0 实现向上生长 */}
            <motion.div
                ref={cardRef}
                initial={false}
                animate={{
                    height: 'auto',
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`absolute bottom-0 left-0 right-0 bg-white/60 rounded-2xl p-5 border border-white/60 z-30 transition-shadow duration-200
                    ${isExpanded ? 'shadow-xl bg-white/90' : 'shadow-sm hover:bg-white/80 hover:shadow-md'}
                `}
            >
                <div className="flex justify-between items-center mb-5">
                    <div className="flex bg-white/40 p-1 rounded-lg border border-white/30">
                        <button onClick={() => setRecordType('note')} className={`flex items-center gap-1 px-3 py-1. 5 rounded-md text-xs font-bold transition-all ${recordType === 'note' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>
                            <FileText size={14} /> 记笔记
                        </button>
                        <button onClick={() => setRecordType('question')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${recordType === 'question' ? 'bg-white shadow-sm text-red-500' : 'text-slate-500 hover:text-slate-700'}`}>
                            <HelpCircle size={14} /> 提疑问
                        </button>
                    </div>
                    {recordType === 'note' ? (
                        <span className="text-xs font-medium bg-orange-50/80 text-orange-600 px-2 py-1 rounded-full border border-orange-100">待归档 {pendingDraftsCount}</span>
                    ) : (
                        <span className="text-xs font-medium bg-red-50/80 text-red-600 px-2 py-1 rounded-full border border-red-100">待解决 {unresolvedCount}</span>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        {/* 学科选择框 */}
                        <div className="relative flex-1 max-w-[140px]" ref={dropdownRef}>
                            <div
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-3 text-slate-700 outline-none cursor-pointer hover:bg-white/70 transition-all flex items-center justify-between"
                            >
                                <span className={subject ? 'text-slate-700 truncate' : 'text-slate-400'}>
                                    {subject ? subject.split(' > ').pop() : '选择学科'}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                            </div>

                            {showSuggestions && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-100 rounded-xl overflow-hidden z-50 min-w-[200px]">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 bg-slate-50 uppercase tracking-wider">
                                        选择学科
                                    </div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {subjects.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-slate-400 text-center">
                                                暂无学科，请先在知识库创建
                                            </div>
                                        ) : (
                                            subjects.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleSelectSuggestion(item)}
                                                    className="flex items-center gap-2 px-3 py-2. 5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                                                >
                                                    <Folder size={14} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{item.path || item.title}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 时间输入框 */}
                        {recordType === 'note' && (
                            <div className="flex-1">
                                <input
                                    type="number"
                                    className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-3 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 hover:bg-white/70 transition-all"
                                    placeholder="时长 (分钟)"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {!isExpanded && (
                        <div onClick={() => setIsExpanded(true)} className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-accent transition-colors border border-dashed border-slate-300/50 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30">
                            <PenLine size={14} /> {recordType === 'note' ? '填写详细笔记' : '描述具体问题'}
                        </div>
                    )}

                    {/* 展开内容 */}
                    <div
                        className="grid transition-all duration-250 ease-out"
                        style={{
                            gridTemplateRows: isExpanded ? '1fr' : '0fr',
                        }}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-1">
                                <div className="relative">
                                    <textarea
                                        className={`w-full bg-white/50 border border-white/50 rounded-xl text-sm p-4 text-slate-700 h-24 resize-none outline-none focus:ring-2 mb-3 placeholder:text-slate-400 hover:bg-white/70 transition-all ${recordType === 'question' ? 'focus:ring-red-100' : 'focus:ring-indigo-100'}`}
                                        placeholder={recordType === 'note' ? "记录核心知识点..." : "请详细描述你的疑问，后续可关联知识点..."}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                    <div onClick={() => setIsExpanded(false)} className="absolute right-2 bottom-5 p-2 text-slate-300 hover:text-slate-500 cursor-pointer">
                                        <ChevronUp size={16} />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`w-full text-white py-2. 5 rounded-xl font-bold shadow-lg transition-all flex justify-center gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed ${recordType === 'question' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    <Save size={16} /> {saving ? '保存中.. .' : (recordType === 'question' ? '录入' : '保存')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}