import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Folder, FileText, ChevronRight, ChevronDown, Search, ArrowLeft } from 'lucide-react';
import WikiMarkdown from '../components/WikiMarkdown';
import { MOCK_FILE_TREE, flattenFiles } from '../data/mockDb';

const FileTreeItem = ({ node, level, activeId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';
    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${activeId === node.id
                        ? 'bg-indigo-50/80 text-accent font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => isFolder ? setIsOpen(!isOpen) : onSelect(node)}
            >
                <span className="text-slate-400">{isFolder ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5"></span>}</span>
                {isFolder ? <Folder size={16} className="text-slate-400" /> : <FileText size={16} className="text-slate-400" />}
                <span className="text-sm truncate">{node.title}</span>
            </div>
            {isFolder && isOpen && node.children && <div>{node.children.map(child => <FileTreeItem key={child.id} node={child} level={level + 1} activeId={activeId} onSelect={onSelect} />)}</div>}
        </div>
    );
};

export default function KnowledgeBase() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeFile, setActiveFile] = useState(null);
    const allFiles = flattenFiles(MOCK_FILE_TREE);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) { const file = allFiles.find(f => f.id === id); if (file) setActiveFile(file); }
    }, [searchParams]);

    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            {/* 1. 固定背景 */}
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            {/* 2. 头部导航 (新增，为了方便返回) */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
                </div>
            </div>

            {/* 3. 内容区域 - 保持原有的 flex 布局 */}
            <div className="relative z-10 flex h-[calc(100vh-140px)] gap-6">

                {/* 左侧文件树 */}
                <div className="w-64 flex-shrink-0 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-white/40 bg-white/20">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <input type="text" placeholder="搜索..." className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:bg-white transition-colors placeholder:text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        <div className="flex flex-col">
                            {MOCK_FILE_TREE.map(node => <FileTreeItem key={node.id} node={node} level={0} activeId={activeFile?.id} onSelect={(node) => { setSearchParams({ id: node.id }); setActiveFile(node); }} />)}
                        </div>
                    </div>
                </div>

                {/* 右侧内容区 */}
                <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col">
                    {activeFile ? (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <h1 className="text-3xl font-bold text-slate-800 mb-6">{activeFile.title}</h1>
                            <WikiMarkdown content={activeFile.content} />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Folder size={48} className="mb-4 opacity-20" />
                            <span>请选择左侧文章开始阅读</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}