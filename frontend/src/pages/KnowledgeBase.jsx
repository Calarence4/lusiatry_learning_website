import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Folder, FileText, ChevronRight, ChevronDown, Search, ArrowLeft,
    Trash2, Edit3, Save, FolderPlus, Tag, MoreVertical, FileEdit,
    Eye, EyeOff, Inbox, Archive
} from 'lucide-react';
import { fileTreeApi } from '../api';

// 文件树节点组件
const FileTreeItem = memo(({ node, level, activeId, onSelect, onRefresh }) => {
    const [isOpen, setIsOpen] = useState(level < 1 || node.is_system);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.title);

    const isFolder = node.type === 'folder';
    const isSystemDraftBox = node.is_system && node.title === '草稿箱';
    const isActive = activeId === node.id;

    const handleToggle = useCallback((e) => {
        e.stopPropagation();
        if (isFolder) {
            setIsOpen(prev => !prev);
        } else {
            onSelect(node);
        }
    }, [isFolder, node, onSelect]);

    const handleRename = useCallback(async () => {
        if (!newName.trim() || newName === node.title) {
            setIsRenaming(false);
            return;
        }
        try {
            await fileTreeApi.update(node.id, { title: newName.trim() });
            onRefresh();
            setIsRenaming(false);
        } catch (err) {
            alert('重命名失败: ' + err.message);
        }
    }, [newName, node.id, node.title, onRefresh]);

    const handleDelete = useCallback(async () => {
        if (node.is_system) return alert('系统文件夹不可删除');
        if (!window.confirm(`确定删除 "${node.title}" 吗？${isFolder ? '（包含所有子文件）' : ''}`)) return;
        try {
            await fileTreeApi.delete(node.id);
            onRefresh();
        } catch (err) {
            alert('删除失败: ' + err.message);
        }
    }, [node.is_system, node.title, node.id, isFolder, onRefresh]);

    const handleToggleSubject = useCallback(async () => {
        try {
            await fileTreeApi.update(node.id, { is_subject: !node.is_subject });
            onRefresh();
        } catch (err) {
            alert('操作失败: ' + err.message);
        }
    }, [node.id, node.is_subject, onRefresh]);

    // 获取文件夹图标
    const getFolderIcon = () => {
        if (isSystemDraftBox) {
            return <Inbox size={16} className="text-orange-500 flex-shrink-0" />;
        }
        if (node.title === '草稿箱') {
            // 用户创建的草稿箱，使用不同图标
            return <Archive size={16} className="text-slate-400 flex-shrink-0" />;
        }
        return <Folder size={16} className={`flex-shrink-0 ${node.is_subject ? 'text-indigo-500' : 'text-slate-400'}`} />;
    };

    return (
        <div className="select-none">
            <div
                className={`group flex items-center gap-1 py-1. 5 px-2 rounded-lg cursor-pointer transition-colors relative
          ${isActive ? 'bg-indigo-50/80 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-white/50'}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleToggle}
            >
                <span className="text-slate-400 w-4 flex-shrink-0">
                    {isFolder && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </span>

                {isFolder ? getFolderIcon() : (
                    <FileText size={16} className="text-slate-400 flex-shrink-0" />
                )}

                {isRenaming ? (
                    <input
                        className="flex-1 text-sm bg-white border border-indigo-300 rounded px-1 outline-none min-w-0"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setIsRenaming(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span className={`text-sm truncate flex-1 min-w-0 ${isSystemDraftBox ? 'text-orange-600 font-medium' : ''}`}>
                        {node.title}
                    </span>
                )}

                {node.is_subject && !node.is_system && (
                    <Tag size={12} className="text-indigo-400 flex-shrink-0" />
                )}

                {/* 系统文件夹不显示操作菜单 */}
                {!node.is_system && (
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-opacity flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(prev => !prev); }}
                    >
                        <MoreVertical size={14} className="text-slate-400" />
                    </button>
                )}

                {showMenu && !node.is_system && (
                    <div
                        className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            onClick={() => { setIsRenaming(true); setShowMenu(false); }}
                        >
                            <Edit3 size={14} /> 重命名
                        </button>
                        {isFolder && (
                            <button
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => { handleToggleSubject(); setShowMenu(false); }}
                            >
                                <Tag size={14} /> {node.is_subject ? '取消学科' : '设为学科'}
                            </button>
                        )}
                        <button
                            className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => { handleDelete(); setShowMenu(false); }}
                        >
                            <Trash2 size={14} /> 删除
                        </button>
                    </div>
                )}
            </div>

            {isFolder && isOpen && node.children?.length > 0 && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            activeId={activeId}
                            onSelect={onSelect}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

// 懒加载 Markdown 预览
const MarkdownPreview = memo(({ content }) => {
    const [ReactMarkdown, setReactMarkdown] = useState(null);
    const [remarkGfm, setRemarkGfm] = useState(null);

    useEffect(() => {
        Promise.all([
            import('react-markdown'),
            import('remark-gfm')
        ]).then(([md, gfm]) => {
            setReactMarkdown(() => md.default);
            setRemarkGfm(() => gfm.default);
        });
    }, []);

    if (!ReactMarkdown || !content) {
        return <p className="text-slate-400">{content ? '加载中...' : '预览区域'}</p>;
    }

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
        </ReactMarkdown>
    );
});

// 主组件
export default function KnowledgeBase() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeFile, setActiveFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fileTree, setFileTree] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [draftBoxId, setDraftBoxId] = useState(null);

    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [createFolderTitle, setCreateFolderTitle] = useState('');
    const [createFolderParentId, setCreateFolderParentId] = useState(null);
    const [createFolderIsSubject, setCreateFolderIsSubject] = useState(false);

    // 防抖搜索
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
        return () => clearTimeout(timer);
    }, [searchText]);

    // 加载文件树
    const fetchFileTree = useCallback(async () => {
        try {
            setLoading(true);

            // 确保系统草稿箱存在
            const draftBox = await fileTreeApi.ensureDraftBox();
            setDraftBoxId(draftBox.id);

            // 获取文件树
            const tree = await fileTreeApi.getTree();
            setFileTree(tree || []);
        } catch (err) {
            console.error('加载知识库失败:', err);
            setFileTree([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFileTree();
    }, [fetchFileTree]);

    // URL 参数变化时加载文件
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            fileTreeApi.getById(id).then(data => {
                setActiveFile(data);
                setEditContent(data.content || '');
            }).catch(console.error);
        }
    }, [searchParams]);

    // 选择文件
    const handleSelectFile = useCallback(async (node) => {
        setSearchParams({ id: node.id });
        try {
            const fullData = await fileTreeApi.getById(node.id);
            setActiveFile(fullData);
            setEditContent(fullData.content || '');
        } catch (err) {
            console.error('加载文件失败:', err);
        }
    }, [setSearchParams]);

    // 保存到当前文件
    const handleSaveToFile = useCallback(async () => {
        if (!activeFile) return;
        try {
            setSaving(true);
            await fileTreeApi.update(activeFile.id, { content: editContent });
            setActiveFile(prev => ({ ...prev, content: editContent }));
            alert('保存成功');
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [activeFile, editContent]);

    // 保存为笔记
    const handleSaveAsNote = useCallback(async () => {
        if (!editContent.trim()) return alert('请输入内容');

        const title = prompt('请输入笔记标题：');
        if (!title?.trim()) return;

        try {
            setSaving(true);
            await fileTreeApi.create({
                title: title.trim(),
                type: 'file',
                parent_id: null,
                content: editContent
            });
            setEditContent('');
            setActiveFile(null);
            setSearchParams({});
            fetchFileTree();
            alert('笔记已保存');
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [editContent, fetchFileTree, setSearchParams]);

    // 保存为草稿
    const handleSaveAsDraft = useCallback(async () => {
        if (!editContent.trim()) return alert('请输入内容');
        if (!draftBoxId) return alert('草稿箱未创建');

        const title = `草稿 ${new Date().toLocaleString()}`;

        try {
            setSaving(true);
            await fileTreeApi.create({
                title,
                type: 'file',
                parent_id: draftBoxId,
                content: editContent
            });
            setEditContent('');
            fetchFileTree();
            alert('已保存到草稿箱');
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [editContent, draftBoxId, fetchFileTree]);

    // 创建文件夹
    const handleCreateFolder = useCallback(async () => {
        if (!createFolderTitle.trim()) return alert('请输入文件夹名称');
        try {
            await fileTreeApi.create({
                title: createFolderTitle.trim(),
                type: 'folder',
                parent_id: createFolderParentId,
                is_subject: createFolderIsSubject
            });
            setShowCreateFolderModal(false);
            setCreateFolderTitle('');
            setCreateFolderIsSubject(false);
            fetchFileTree();
        } catch (err) {
            alert('创建失败: ' + err.message);
        }
    }, [createFolderTitle, createFolderParentId, createFolderIsSubject, fetchFileTree]);

    // 搜索过滤
    const displayTree = useMemo(() => {
        if (!debouncedSearch) return fileTree;

        const filterTree = (nodes) => {
            return nodes.filter(node => {
                const matches = node.title.toLowerCase().includes(debouncedSearch.toLowerCase());
                const childMatches = node.children?.length > 0 && filterTree(node.children).length > 0;
                return matches || childMatches;
            }).map(node => ({
                ...node,
                children: node.children ? filterTree(node.children) : undefined
            }));
        };

        return filterTree(fileTree);
    }, [fileTree, debouncedSearch]);

    // 获取所有文件夹（排除系统草稿箱）
    const allFolders = useMemo(() => {
        const result = [];
        const collect = (nodes) => {
            nodes.forEach(node => {
                if (node.type === 'folder' && !node.is_system) {
                    result.push(node);
                    if (node.children) collect(node.children);
                }
            });
        };
        collect(fileTree);
        return result;
    }, [fileTree]);

    if (loading) {
        return (
            <div className="relative w-full min-h-screen text-slate-800 font-sans p-6">
                <div className="fixed inset-0 z-0 bg-slate-50/40"></div>
                <div className="relative z-10 flex items-center justify-center h-screen">
                    <div className="animate-pulse space-y-4 w-full max-w-md">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-64 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            {/* 背景 */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90"
                style={{ backgroundImage: 'url("https://images.unsplash. com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}
            />
            <div className="fixed inset-0 z-0 bg-slate-50/40" />

            {/* 头部导航 */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
            </div>

            {/* 内容区域 */}
            <div className="relative z-10 flex h-[calc(100vh-140px)] gap-6">

                {/* 左侧文件树 */}
                <div className="w-60 flex-shrink-0 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-white/40 bg-white/20 space-y-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜索..."
                                className="w-full bg-white/50 border border-white/50 pl-9 pr-3 py-2 rounded-lg text-xs outline-none focus:bg-white transition-colors placeholder:text-slate-400"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowCreateFolderModal(true)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1. 5 bg-white/50 hover:bg-white border border-white/50 rounded-lg text-xs text-slate-600 transition-colors"
                        >
                            <FolderPlus size={14} /> 新建文件夹
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {displayTree.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                {debouncedSearch ? '未找到匹配项' : '知识库为空'}
                            </div>
                        ) : (
                            displayTree.map(node => (
                                <FileTreeItem
                                    key={node.id}
                                    node={node}
                                    level={0}
                                    activeId={activeFile?.id}
                                    onSelect={handleSelectFile}
                                    onRefresh={fetchFileTree}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* 右侧编辑区 */}
                <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col">
                    {/* 工具栏 */}
                    <div className="flex items-center justify-between p-4 border-b border-white/40 bg-white/20">
                        <div className="flex items-center gap-2">
                            <FileEdit size={18} className="text-slate-500" />
                            <h2 className="font-bold text-slate-700">
                                {activeFile ? activeFile.title : '新建笔记'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowPreview(prev => !prev)}
                                className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-indigo-100 text-indigo-600' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
                            >
                                {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>

                            {activeFile && (
                                <button
                                    onClick={handleSaveToFile}
                                    disabled={saving}
                                    className="px-3 py-1. 5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Save size={14} /> {saving ? '.. .' : '保存'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 编辑器区域 */}
                    <div className="flex-1 flex overflow-hidden">
                        <div className={`flex flex-col ${showPreview ? 'w-1/2 border-r border-white/40' : 'w-full'}`}>
                            <div className="px-4 py-2 bg-slate-50/50 text-xs font-medium text-slate-500 border-b border-white/40">
                                Markdown 编辑
                            </div>
                            <textarea
                                className="flex-1 p-4 bg-transparent text-sm text-slate-700 resize-none outline-none font-mono"
                                placeholder="使用 Markdown 语法书写笔记..."
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                        </div>

                        {showPreview && (
                            <div className="w-1/2 flex flex-col">
                                <div className="px-4 py-2 bg-slate-50/50 text-xs font-medium text-slate-500 border-b border-white/40">
                                    实时预览
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto prose prose-slate prose-sm max-w-none">
                                    <MarkdownPreview content={editContent} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 底部保存按钮 */}
                    <div className="p-4 border-t border-white/40 bg-white/20 flex gap-3">
                        <button
                            onClick={handleSaveAsNote}
                            disabled={saving || !editContent.trim()}
                            className="flex-1 py-2. 5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={16} /> 保存为笔记
                        </button>
                        <button
                            onClick={handleSaveAsDraft}
                            disabled={saving || !editContent.trim()}
                            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Inbox size={16} /> 保存为草稿
                        </button>
                    </div>
                </div>
            </div>

            {/* 新建文件夹弹窗 */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">新建文件夹</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">名称</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="文件夹名称"
                                    value={createFolderTitle}
                                    onChange={(e) => setCreateFolderTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">位置</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={createFolderParentId || ''}
                                    onChange={(e) => setCreateFolderParentId(e.target.value ? parseInt(e.target.value) : null)}
                                >
                                    <option value="">根目录</option>
                                    {allFolders.map(folder => (
                                        <option key={folder.id} value={folder.id}>{folder.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isSubject"
                                    checked={createFolderIsSubject}
                                    onChange={(e) => setCreateFolderIsSubject(e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <label htmlFor="isSubject" className="text-sm text-slate-600">
                                    设为学科分类
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => { setShowCreateFolderModal(false); setCreateFolderTitle(''); }}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
                            >
                                创建
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}