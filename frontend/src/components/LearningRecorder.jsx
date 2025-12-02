import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, PenLine, Save, HelpCircle, FileText, Folder, ChevronDown, BookOpen, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { draftsApi, problemsApi, subjectsApi, studyTimeApi, fileTreeApi } from '../api';

export default function LearningRecorder() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [pendingDraftsCount, setPendingDraftsCount] = useState(0);
    const [unresolvedCount, setUnresolvedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [subjectId, setSubjectId] = useState(null);  // 存储一级学科ID
    const [rootSubjectName, setRootSubjectName] = useState('');  // 一级学科名称（用于存储）
    const [saving, setSaving] = useState(false);
    const [recordType, setRecordType] = useState('note');
    const [subject, setSubject] = useState('');  // 显示的学科名称（可能包含子学科）
    const [duration, setDuration] = useState('');
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [baseHeight, setBaseHeight] = useState(0);
    const [currentLevel, setCurrentLevel] = useState([]);  // 当前层级的学科列表
    const [selectedPath, setSelectedPath] = useState([]);  // 选择路径 [{id, title}, ...]
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
                
                // 获取学科列表和问题数
                const [subjectsData, problemsData] = await Promise.all([
                    subjectsApi.getAll(),
                    problemsApi.getAll()
                ]);
                setSubjects(subjectsData || []);
                // 过滤真正未解决的问题（没有 is_solved 且没有 answer）
                const unsolvedProblems = (problemsData || []).filter(p => !p.is_solved && !p.answer);
                setUnresolvedCount(unsolvedProblems.length);
                
                // 获取草稿箱中的文件数量
                const draftBox = await fileTreeApi.ensureDraftBox();
                const tree = await fileTreeApi.getTree();
                // 找到草稿箱并计算其子文件数
                const findDraftBoxChildren = (nodes) => {
                    for (const node of nodes) {
                        if (node.id === draftBox.id) {
                            return node.children?.length || 0;
                        }
                        if (node.children) {
                            const count = findDraftBoxChildren(node.children);
                            if (count >= 0) return count;
                        }
                    }
                    return 0;
                };
                setPendingDraftsCount(findDraftBoxChildren(tree || []));
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

    // 打开下拉时初始化为一级学科
    const openDropdown = () => {
        setCurrentLevel(subjects);
        setSelectedPath([]);
        setShowSuggestions(true);
    };

    // 选择一个学科项
    const handleSelectItem = (item) => {
        const newPath = [...selectedPath, { id: item.id, title: item.title }];
        
        // 检查是否有子学科
        if (item.children && item.children.length > 0) {
            // 有子学科，进入下一级
            setSelectedPath(newPath);
            setCurrentLevel(item.children);
        } else {
            // 没有子学科，完成选择
            finishSelection(newPath);
        }
    };

    // 完成选择（手动确认或无子学科时）
    const finishSelection = (path) => {
        if (path.length === 0) return;
        
        // 一级学科ID和名称用于存储
        const rootSubjectId = path[0].id;
        const rootName = path[0].title;
        // 完整路径用于显示
        const displayName = path.map(p => p.title).join(' > ');
        
        setSubjectId(rootSubjectId);
        setRootSubjectName(rootName);
        setSubject(displayName);
        setShowSuggestions(false);
        setSelectedPath([]);
        setCurrentLevel([]);
    };

    // 返回上一级
    const goBack = () => {
        if (selectedPath.length === 0) {
            setShowSuggestions(false);
            return;
        }
        
        const newPath = selectedPath.slice(0, -1);
        setSelectedPath(newPath);
        
        if (newPath.length === 0) {
            setCurrentLevel(subjects);
        } else {
            // 找到上一级的children
            let current = subjects;
            for (const p of newPath) {
                const found = current.find(s => s.id === p.id);
                if (found && found.children) {
                    current = found.children;
                }
            }
            setCurrentLevel(current);
        }
    };

    const handleSelectSuggestion = (subjectItem) => {
        setSubject(subjectItem.path || subjectItem.title);
        setSubjectId(subjectItem.id);
        setShowSuggestions(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (recordType === 'note') {
                // 记笔记模式：记录学习时长和日志内容
                if (!subjectId) {
                    alert("请选择学科");
                    return;
                }
                if (!duration || parseInt(duration) <= 0) {
                    alert("请填写学习时长");
                    return;
                }
                
                await studyTimeApi.create({
                    log_date: new Date().toISOString().split('T')[0],
                    subject: rootSubjectName,  // 使用一级学科名称
                    duration: parseInt(duration),
                    note: content || null
                });
                alert("学习日志已记录");
            } else {
                // 提疑问模式：录入问题
                if (!content) {
                    alert("请填写问题内容");
                    return;
                }
                await problemsApi.create({
                    problem: content,
                    subject: subjectId
                });
                setUnresolvedCount(prev => prev + 1);
                alert("已录入问题集，待解决");
            }

            setContent('');
            setDuration('');
            setSubject('');
            setSubjectId(null);
            setRootSubjectName('');
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
                        {/* 学科选择框 - 级联选择 */}
                        <div className="relative flex-1 max-w-[140px]" ref={dropdownRef}>
                            <div
                                onClick={openDropdown}
                                className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-3 text-slate-700 outline-none cursor-pointer hover:bg-white/70 transition-all flex items-center justify-between"
                            >
                                <span className={subject ? 'text-slate-700 truncate' : 'text-slate-400'}>
                                    {subject ? subject.split(' > ').pop() : '选择学科'}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                            </div>

                            {showSuggestions && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-100 rounded-xl overflow-hidden z-50 min-w-[200px]">
                                    {/* 头部：显示当前路径 */}
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 bg-slate-50 uppercase tracking-wider flex items-center gap-2">
                                        {selectedPath.length > 0 && (
                                            <button onClick={goBack} className="p-0.5 hover:bg-slate-200 rounded transition-colors">
                                                <ArrowLeft size={12} />
                                            </button>
                                        )}
                                        <span className="truncate">
                                            {selectedPath.length === 0 ? '选择学科' : selectedPath.map(p => p.title).join(' > ')}
                                        </span>
                                    </div>
                                    
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {currentLevel.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-slate-400 text-center">
                                                暂无学科，请先在知识库创建
                                            </div>
                                        ) : (
                                            <>
                                                {currentLevel.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleSelectItem(item)}
                                                        className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <Folder size={14} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">{item.title}</span>
                                                        </div>
                                                        {item.children && item.children.length > 0 && (
                                                            <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                {/* 确认按钮：当已选择至少一级时显示 */}
                                                {selectedPath.length > 0 && (
                                                    <div
                                                        onClick={() => finishSelection(selectedPath)}
                                                        className="px-3 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-center transition-colors border-t border-slate-100"
                                                    >
                                                        确认选择：{selectedPath[0].title}
                                                    </div>
                                                )}
                                            </>
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
                            <PenLine size={14} /> {recordType === 'note' ? '填写学习日志' : '描述具体问题'}
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
                                {recordType === 'note' ? (
                                    // 笔记模式：文本框 + 两个小按钮
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-4 text-slate-700 h-24 resize-none outline-none focus:ring-2 mb-2 placeholder:text-slate-400 hover:bg-white/70 transition-all focus:ring-indigo-100"
                                                placeholder="记录学习内容、心得笔记..."
                                                value={content}
                                                onChange={e => setContent(e.target.value)}
                                            />
                                            <div onClick={() => setIsExpanded(false)} className="absolute right-2 bottom-4 p-2 text-slate-300 hover:text-slate-500 cursor-pointer">
                                                <ChevronUp size={16} />
                                            </div>
                                        </div>
                                        
                                        {/* 两个小按钮并排 */}
                                        <div className="flex gap-2">
                                        {/* 记录笔记按钮 - 跳转知识库 */}
                                        <button
                                            onClick={() => navigate('/knowledge')}
                                            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold transition-all flex justify-center gap-1.5 items-center"
                                        >
                                            <FileText size={14} /> 记录笔记
                                        </button>                                            {/* 记录学习日志按钮 */}
                                            <button
                                                onClick={handleSave}
                                                disabled={saving || !subjectId || !duration}
                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-xs font-bold transition-all flex justify-center gap-1.5 items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Clock size={14} /> {saving ? '保存中...' : '记录日志'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // 问题模式：保持原有逻辑
                                    <>
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-4 text-slate-700 h-24 resize-none outline-none focus:ring-2 mb-3 placeholder:text-slate-400 hover:bg-white/70 transition-all focus:ring-red-100"
                                                placeholder="请详细描述你的疑问，后续可关联知识点..."
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
                                            className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold shadow-lg transition-all flex justify-center gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save size={16} /> {saving ? '保存中...' : '录入'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}