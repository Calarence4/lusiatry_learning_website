import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronUp, PenLine, Save, FolderOpen, HelpCircle, FileText, Tag, ChevronRight, Folder } from 'lucide-react';
import { INITIAL_DRAFTS, MOCK_FILE_TREE, MOCK_QUESTIONS } from '../data/mockDb';

export default function LearningRecorder() {
    // ... (内部逻辑状态保持不变，此处省略以节省 token，请保留你原有的逻辑代码)
    const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
    const [questions, setQuestions] = useState(MOCK_QUESTIONS);
    const [recordType, setRecordType] = useState('note');
    const [subject, setSubject] = useState('');
    const [duration, setDuration] = useState('');
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentSuggestions = useMemo(() => {
        const input = subject;
        const parts = input.split('/');
        const isSeekingNextLevel = input.endsWith('/') || input === '';
        const traversalPath = isSeekingNextLevel ? parts.filter(p => p) : parts.slice(0, -1);

        let currentNodeList = MOCK_FILE_TREE;
        for (const part of traversalPath) {
            const found = currentNodeList.find(node => node.title === part && node.children);
            if (found) currentNodeList = found.children;
            else return [];
        }

        const candidates = currentNodeList.filter(node => node.type === 'folder' && node.isSubject);
        if (!isSeekingNextLevel) {
            const filterText = parts[parts.length - 1].toLowerCase();
            return candidates.filter(node => node.title.toLowerCase().includes(filterText));
        }
        return candidates;
    }, [subject]);

    const handleSelectSuggestion = (node) => {
        const input = subject;
        const parts = input.split('/');
        const isSeekingNextLevel = input.endsWith('/') || input === '';
        const prefix = isSeekingNextLevel ? input : parts.slice(0, -1).join('/') + (parts.length > 1 ? '/' : '');
        const newPath = prefix + node.title;
        const hasSubSubjects = node.children && node.children.some(c => c.isSubject);
        setSubject(newPath + (hasSubSubjects ? '/' : ''));
        if (!hasSubSubjects) setShowSuggestions(false);
    };

    const handleSave = () => {
        if (!content && !subject) return;
        if (recordType === 'note') {
            const newDraft = {
                id: Date.now(),
                title: subject ? `${subject.split('/').pop()} 笔记` : '未命名记录',
                subject, content, createdAt: new Date().toISOString(), status: 'pending'
            };
            setDrafts([newDraft, ...drafts]);
            alert("已保存至笔记草稿箱");
        } else {
            const newQ = {
                id: Date.now(),
                title: content,
                subject,
                status: 'unresolved',
                createdAt: new Date().toISOString(),
                solution: ''
            };
            setQuestions([newQ, ...questions]);
            alert("已录入问题集，待解决");
        }
        setContent(''); setDuration(''); setSubject(''); setIsExpanded(false);
        setShowSuggestions(false);
    };

    const pendingDrafts = drafts.filter(d => d.status === 'pending').length;
    const unresolvedCount = questions.filter(q => q.status === 'unresolved').length;

    return (
        // 优化：bg-white/60 代替 backdrop-blur
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 rounded-2xl p-5 shadow-sm border border-white/60 h-fit z-30 transition-all duration-200 hover:bg-white/80 hover:shadow-md"
        >
            <div className="flex justify-between items-center mb-5">
                <div className="flex bg-white/40 p-1 rounded-lg border border-white/30">
                    <button onClick={() => setRecordType('note')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${recordType === 'note' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={14} /> 记笔记</button>
                    <button onClick={() => setRecordType('question')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${recordType === 'question' ? 'bg-white shadow-sm text-red-500' : 'text-slate-500 hover:text-slate-700'}`}><HelpCircle size={14} /> 提疑问</button>
                </div>
                {recordType === 'note' ? (<span className="text-xs font-medium bg-orange-50/80 text-orange-600 px-2 py-1 rounded-full border border-orange-100">待归档 {pendingDrafts}</span>) : (<span className="text-xs font-medium bg-red-50/80 text-red-600 px-2 py-1 rounded-full border border-red-100">待解决 {unresolvedCount}</span>)}
            </div>

            <div className="space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1" ref={dropdownRef}>
                        <input
                            className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-3 pl-9 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 transition-all hover:bg-white/70"
                            placeholder="学科 (如: 计算机/React)"
                            value={subject}
                            onChange={e => { setSubject(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        <FolderOpen size={14} className="absolute left-3 top-3.5 text-slate-400" />

                        {showSuggestions && currentSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-100 rounded-xl overflow-hidden z-50">
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 bg-slate-50 uppercase tracking-wider">
                                    选择 {subject.endsWith('/') || subject === '' ? '下级分支' : '匹配项'}
                                </div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {currentSuggestions.map((node, i) => (
                                        <div key={i} onClick={() => handleSelectSuggestion(node)} className="flex items-center justify-between px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer border-b border-slate-50 last:border-none transition-colors">
                                            <div className="flex items-center gap-2"><Folder size={14} className="text-slate-400" /><span>{node.title}</span></div>
                                            {node.children && node.children.some(c => c.isSubject) && <ChevronRight size={14} className="text-slate-300" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {recordType === 'note' && (
                        <div className="relative w-20">
                            <input type="number" className="w-full bg-white/50 border border-white/50 rounded-xl text-sm p-3 pl-8 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 hover:bg-white/70 transition-all" placeholder="Min" value={duration} onChange={e => setDuration(e.target.value)} />
                            <span className="absolute left-2 top-3.5 text-slate-400 text-xs font-bold"><Clock size={12} /></span>
                        </div>
                    )}
                </div>

                {!isExpanded && (
                    <div onClick={() => setIsExpanded(true)} className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-accent transition-colors border border-dashed border-slate-300/50 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30">
                        <PenLine size={14} /> {recordType === 'note' ? '填写详细笔记' : '描述具体问题'}
                    </div>
                )}

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="relative mt-1">
                                <textarea className={`w-full bg-white/50 border border-white/50 rounded-xl text-sm p-4 text-slate-700 h-24 resize-none outline-none focus:ring-2 mb-3 placeholder:text-slate-400 hover:bg-white/70 transition-all ${recordType === 'question' ? 'focus:ring-red-100' : 'focus:ring-indigo-100'}`} placeholder={recordType === 'note' ? "记录核心知识点..." : "请详细描述你的疑问，后续可关联知识点..."} value={content} onChange={e => setContent(e.target.value)} />
                                <div onClick={() => setIsExpanded(false)} className="absolute right-2 bottom-5 p-2 text-slate-300 hover:text-slate-500 cursor-pointer"><ChevronUp size={16} /></div>
                            </div>
                            <button onClick={handleSave} className={`w-full text-white py-2.5 rounded-xl font-bold shadow-lg transition-all flex justify-center gap-2 items-center ${recordType === 'question' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}><Save size={16} /> {recordType === 'question' ? '录入' : '保存'}</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}