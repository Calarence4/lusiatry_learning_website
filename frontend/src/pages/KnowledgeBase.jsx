import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Folder, FileText, ChevronRight, ChevronDown, Search, ArrowLeft,
    Trash2, Edit3, Save, FolderPlus, Tag, MoreVertical, FileEdit,
    Eye, EyeOff, Inbox
} from 'lucide-react';
import { fileTreeApi } from '../api';

// ============================================
// 文件树节点组件
// ============================================
const FileTreeItem = ({ node, level, activeId, onSelect, onRefresh, isDraftBox = false }) => {
    const [isOpen, setIsOpen] = useState(level < 2 || isDraftBox);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.title);

    const isFolder = node.type === 'folder';
    const isSpecialFolder = node.title === '草稿箱';

    const handleRename = async () => {
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
    };

    const handleDelete = async () => {
        if (isSpecialFolder) {
            return alert('草稿箱不可删除');
        }
        if (!window.confirm(`确定删除 "${node.title}" 吗？${isFolder ? '（包含所有子文件）' : ''}`)) return;
        try {
            await fileTreeApi.delete(node.id);
            onRefresh();
        } catch (err) {
            alert('删除失败: ' + err.message);
        }
    };

    const handleToggleSubject = async () => {
        try {
            await fileTreeApi.update(node.id, { is_subject: !node.is_subject });
            onRefresh();
        } catch (err) {
            alert('操作失败: ' + err.message);
        }
    };

    return (
        <div className="select-none">
            <div
                className={`group flex items-center gap-1 py-1. 5 px-2 rounded-lg cursor-pointer transition-colors relative
          ${activeId === node.id
                        ? 'bg-indigo-50/80 text-accent font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => isFolder ? setIsOpen(!isOpen) : onSelect(node)}
                onContextMenu={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
            >
                <span className="text-slate-400 w-4">
                    {isFolder ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                </span>

                {isFolder ? (
                    isSpecialFolder ? (
                        <Inbox size={16} className="text-orange-400" />
                    ) : (
                        <Folder size={16} className={node.is_subject ? 'text-indigo-500' : 'text-slate-400'} />
                    )
                ) : (
                    <FileText size={16} className="text-slate-400" />
                )}

                {isRenaming ? (
                    <input
                        className="flex-1 text-sm bg-white border border-indigo-300 rounded px-1 outline-none"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span className={`text-sm truncate flex-1 ${isSpecialFolder ? 'text-orange-600 font-medium' : ''}`}>
                        {node.title}
                    </span>
                )}

                {node.is_subject && !isSpecialFolder && (
                    <Tag size={12} className="text-indigo-400" title="可作为学科分类" />
                )}

                {/* 操作菜单按钮 */}
                {!isSpecialFolder && (
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    >
                        <MoreVertical size={14} className="text-slate-400" />
                    </button>
                )}

                {/* 下拉菜单 */}
                {showMenu && !isSpecialFolder && (
                    <div
                        className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full px-3 py-1. 5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
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

            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            activeId={activeId}
                            onSelect={onSelect}
                            onRefresh={onRefresh}
                            isDraftBox={isSpecialFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================
// 主组件
// ============================================
export default function KnowledgeBase() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeFile, setActiveFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fileTree, setFileTree] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [draftBoxId, setDraftBoxId] = useState(null);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // 新建文件夹弹窗
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [createFolderTitle, setCreateFolderTitle] = useState('');
    const [createFolderParentId, setCreateFolderParentId] = useState(null);
    const [createFolderIsSubject, setCreateFolderIsSubject] = useState(false);

    // 加载文件树
    const fetchFileTree = useCallback(async () => {
        try {
            setLoading(true);
            const tree = await fileTreeApi.getTree();

            // 查找或创建草稿箱
            let draftBox = (tree || []).find(item => item.title === '草稿箱' && item.type === 'folder');

            if (!draftBox) {
                // 创建草稿箱
                const created = await fileTreeApi.create({
                    title: '草稿箱',
                    type: 'folder',
                    parent_id: null,
                    is_subject: 0
                });
                draftBox = created;
                // 重新获取
                const newTree = await fileTreeApi.getTree();
                setFileTree(newTree || []);
                setDraftBoxId(created.id);
            } else {
                setFileTree(tree || []);
                setDraftBoxId(draftBox.id);
            }
        } catch (err) {
            console.error('加载知识库失败:', err);
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
                setIsEditing(false);
            }).catch(err => {
                console.error('加载文件失败:', err);
            });
        }
    }, [searchParams]);

    // 选择文件
    const handleSelectFile = async (node) => {
        setSearchParams({ id: node.id });
        try {
            const fullData = await fileTreeApi.getById(node.id);
            setActiveFile(fullData);
            setEditContent(fullData.content || '');
            setIsEditing(false);
        } catch (err) {
            console.error('加载文件失败:', err);
        }
    };

    // 保存到当前文件
    const handleSaveToFile = async () => {
        if (!activeFile) return;
        try {
            setSaving(true);
            await fileTreeApi.update(activeFile.id, { content: editContent });
            setActiveFile({ ...activeFile, content: editContent });
            setIsEditing(false);
            alert('保存成功');
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // 保存为笔记（新建文件）
    const handleSaveAsNote = async () => {
        if (!editContent.trim()) return alert('请输入内容');

        const title = prompt('请输入笔记标题：');
        if (!title?.trim()) return;

        // 选择保存位置
        const folders = getAllFolders(fileTree).filter(f => f.title !== '草稿箱');
        let parentId = null;

        if (folders.length > 0) {
            const folderNames = folders.map((f, i) => `${i + 1}. ${f.title}`).join('\n');
            const choice = prompt(`选择保存位置（输入序号，留空保存到根目录）：\n${folderNames}`);
            if (choice && parseInt(choice) > 0 && parseInt(choice) <= folders.length) {
                parentId = folders[parseInt(choice) - 1].id;
            }
        }

        try {
            setSaving(true);
            await fileTreeApi.create({
                title: title.trim(),
                type: 'file',
                parent_id: parentId,
                content: editContent
            });
            setEditContent('');
            setActiveFile(null);
            fetchFileTree();
            alert('笔记已保存');
        } catch (err) {
            alert('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // 保存为草稿
    const handleSaveAsDraft = async () => {
        if (!editContent.trim()) return alert('请输入内容');
        if (!draftBoxId) return alert('草稿箱未创建');

        const title = prompt('请输入草稿标题：', `草稿 ${new Date().toLocaleString()}`);
        if (!title?.trim()) return;

        try {
            setSaving(true);
            await fileTreeApi.create({
                title: title.trim(),
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
    };

    // 创建文件夹
    const handleCreateFolder = async () => {
        if (!createFolderTitle.trim()) {
            return alert('请输入文件夹名称');
        }
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
    };

    // 搜索过滤
    const filterTree = (nodes, text) => {
        if (!text) return nodes;
        return nodes.filter(node => {
            if (node.title.toLowerCase().includes(text.toLowerCase())) return true;
            if (node.children?.length > 0) {
                return filterTree(node.children, text).length > 0;
            }
            return false;
        }).map(node => ({
            ...node,
            children: node.children ? filterTree(node.children, text) : undefined
        }));
    };

    const displayTree = filterTree(fileTree, searchText);

    // 获取所有文件夹
    const getAllFolders = (nodes, result = []) => {
        nodes.forEach(node => {
            if (node.type === 'folder') {
                result.push(node);
                if (node.children) getAllFolders(node.children, result);
            }
        });
        return result;
    };

    const allFolders = getAllFolders(fileTree);

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
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            {/* 头部导航 */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="relative z-10 flex h-[calc(100vh-140px)] gap-6">

                {/* 左侧文件树 */}
                <div className="w-64 flex-shrink-0 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                    {/* 搜索和新建 */}
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

                    {/* 文件树 */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {displayTree.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                {searchText ? '未找到匹配项' : '知识库为空'}
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
                            {/* 预览切换 */}
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className={`p-2 rounded-lg transition-colors ${showPreview ? 'bg-indigo-100 text-indigo-600' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
                                title={showPreview ? '隐藏预览' : '显示预览'}
                            >
                                {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>

                            {/* 如果是编辑现有文件 */}
                            {activeFile && (
                                <button
                                    onClick={handleSaveToFile}
                                    disabled={saving}
                                    className="px-3 py-1. 5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Save size={14} /> {saving ? '保存中...' : '保存'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 编辑器区域 */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* 编辑区 */}
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

                        {/* 预览区 */}
                        {showPreview && (
                            <div className="w-1/2 flex flex-col">
                                <div className="px-4 py-2 bg-slate-50/50 text-xs font-medium text-slate-500 border-b border-white/40">
                                    实时预览
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto prose prose-slate prose-sm max-w-none">
                                    {editContent ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {editContent}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-slate-400">预览区域</p>
                                    )}
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
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-96 animate-in fade-in zoom-in-95 duration-200">
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
                                    {allFolders.filter(f => f.title !== '草稿箱').map(folder => (
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