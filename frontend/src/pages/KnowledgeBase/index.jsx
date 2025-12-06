import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Search, FolderPlus, Save, Inbox, Plus, FilePlus,
    BookOpen, Link2, Pencil, FileText, Upload, ChevronDown, ChevronRight, FolderOpen
} from 'lucide-react';
import { fileTreeApi } from '../../api';
import { useToast } from '../../components/Toast';

// 导入子组件
import FileTreeItem from './FileTreeItem';
import MarkdownPreview from './MarkdownPreview';
import LivePreviewEditor from './LivePreviewEditor';
import EditorToolbar from './EditorToolbar';
import { CreateFolderModal, CreateFileModal } from './Modals';
import ImportModal from './ImportModal';

// 主组件
export default function KnowledgeBase() {
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeFile, setActiveFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fileTree, setFileTree] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [draftBoxId, setDraftBoxId] = useState(null);

    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);

    // 新建笔记名称
    const [newNoteName, setNewNoteName] = useState('');
    const [nameInputShake, setNameInputShake] = useState(false);

    // 阅读/编辑模式切换
    const [viewMode, setViewMode] = useState('read'); // 'read' | 'edit' - 默认阅读模式
    // 编辑子模式：阅览模式（live）或源代码模式（source）
    const [editMode, setEditMode] = useState('live'); // 'live' | 'source'

    // 编辑器引用
    const editorRef = useRef(null);

    // 笔记根文件夹展开状态
    const [notesExpanded, setNotesExpanded] = useState(true);

    // 模态框状态
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showCreateFileModal, setShowCreateFileModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [createFileParentId, setCreateFileParentId] = useState(null);
    const [createFileParentName, setCreateFileParentName] = useState('');

    // 剪贴板状态（用于剪切/粘贴）
    const [clipboard, setClipboard] = useState(null);

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

    // 选择文件 - 选中后自动进入阅读模式
    const handleSelectFile = useCallback(async (node) => {
        if (node.type === 'folder') return;
        setSearchParams({ id: node.id });
        try {
            const fullData = await fileTreeApi.getById(node.id);
            setActiveFile(fullData);
            setEditContent(fullData.content || '');
            setViewMode('read'); // 选中文件自动进入阅读模式
        } catch (err) {
            console.error('加载文件失败:', err);
            toast.error('加载文件失败');
        }
    }, [setSearchParams, toast]);

    // 保存到当前文件
    const handleSaveToFile = useCallback(async (content) => {
        if (!activeFile) return;
        const contentToSave = content ?? editContent;
        try {
            setSaving(true);
            await fileTreeApi.update(activeFile.id, { content: contentToSave });
            setActiveFile(prev => ({ ...prev, content: contentToSave }));
            setEditContent(contentToSave);
            toast.success('保存成功');
        } catch (err) {
            toast.error('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [activeFile, editContent, toast]);

    // 保存为笔记（直接使用输入框的名称）
    const handleSaveAsNote = useCallback(async () => {
        if (!editContent.trim()) return toast.warning('请输入内容');

        // 检查名称是否填写
        if (!newNoteName.trim()) {
            setNameInputShake(true);
            setTimeout(() => setNameInputShake(false), 500);
            return;
        }

        try {
            setSaving(true);
            await fileTreeApi.create({
                title: newNoteName.trim(),
                type: 'file',
                parent_id: null,
                content: editContent
            });
            setEditContent('');
            setNewNoteName('');
            setActiveFile(null);
            setSearchParams({});
            fetchFileTree();
            toast.success('笔记已保存');
        } catch (err) {
            toast.error('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [editContent, newNoteName, fetchFileTree, setSearchParams, toast]);

    // 保存为草稿
    const handleSaveAsDraft = useCallback(async () => {
        if (!editContent.trim()) return toast.warning('请输入内容');
        if (!draftBoxId) return toast.error('草稿箱未创建');

        // 检查名称是否填写，如果填写了就用填写的，否则用默认名称
        let title;
        if (newNoteName.trim()) {
            title = newNoteName.trim();
        } else {
            // 如果没有填写名称，触发摇晃提示
            setNameInputShake(true);
            setTimeout(() => setNameInputShake(false), 500);
            return;
        }

        try {
            setSaving(true);
            await fileTreeApi.create({
                title,
                type: 'file',
                parent_id: draftBoxId,
                content: editContent
            });
            setEditContent('');
            setNewNoteName('');
            fetchFileTree();
            toast.success('已保存到草稿箱');
        } catch (err) {
            toast.error('保存失败: ' + err.message);
        } finally {
            setSaving(false);
        }
    }, [editContent, newNoteName, draftBoxId, fetchFileTree, toast]);

    // 创建文件夹
    const handleCreateFolder = useCallback(async (data) => {
        try {
            await fileTreeApi.create({
                title: data.title,
                type: 'folder',
                parent_id: data.parent_id,
                is_subject: data.is_subject
            });
            setShowCreateFolderModal(false);
            fetchFileTree();
            toast.success('文件夹创建成功');
        } catch (err) {
            toast.error('创建失败: ' + err.message);
        }
    }, [fetchFileTree, toast]);

    // 创建文件（从模态框）
    const handleCreateFile = useCallback(async (title) => {
        try {
            const newFile = await fileTreeApi.create({
                title,
                type: 'file',
                parent_id: createFileParentId,
                content: ''
            });
            setShowCreateFileModal(false);
            fetchFileTree();
            // 自动选中新文件
            setSearchParams({ id: newFile.id });
            setActiveFile({ id: newFile.id, title, type: 'file', content: '' });
            setEditContent('');
            toast.success('文件创建成功');
        } catch (err) {
            toast.error('创建失败: ' + err.message);
        }
    }, [createFileParentId, fetchFileTree, setSearchParams, toast]);

    // 文件树内联创建文件
    const handleInlineCreateFile = useCallback(async (parentId, title) => {
        try {
            const newFile = await fileTreeApi.create({
                title,
                type: 'file',
                parent_id: parentId,
                content: ''
            });
            fetchFileTree();
            // 自动选中新文件
            setSearchParams({ id: newFile.id });
            setActiveFile({ id: newFile.id, title, type: 'file', content: '' });
            setEditContent('');
            toast.success('文件创建成功');
        } catch (err) {
            toast.error('创建失败: ' + err.message);
        }
    }, [fetchFileTree, setSearchParams, toast]);

    // 移动文件/文件夹（拖拽）
    const handleMoveNode = useCallback(async (sourceId, targetId) => {
        try {
            await fileTreeApi.update(sourceId, { parent_id: targetId });
            fetchFileTree();
            toast.success('移动成功');
        } catch (err) {
            toast.error('移动失败: ' + err.message);
        }
    }, [fetchFileTree, toast]);

    // 剪切节点
    const handleCutNode = useCallback((node) => {
        setClipboard(node);
        toast.info(`已剪切: ${node.title}`);
    }, [toast]);

    // 粘贴节点到目标文件夹
    const handlePasteNode = useCallback(async (targetFolderId) => {
        if (!clipboard) return;
        try {
            await fileTreeApi.update(clipboard.id, { parent_id: targetFolderId });
            setClipboard(null);
            fetchFileTree();
            toast.success('粘贴成功');
        } catch (err) {
            toast.error('粘贴失败: ' + err.message);
        }
    }, [clipboard, fetchFileTree, toast]);

    // 在文件夹内创建子文件夹
    const handleCreateSubFolder = useCallback((parentId) => {
        // 找到父文件夹名称
        const findFolder = (nodes) => {
            for (const node of nodes) {
                if (node.id === parentId) return node.title;
                if (node.children) {
                    const found = findFolder(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        const parentName = findFolder(fileTree) || '根目录';

        // 这里可以弹出模态框或直接创建
        const title = prompt(`在 "${parentName}" 中创建文件夹\n请输入文件夹名称：`);
        if (!title?.trim()) return;

        fileTreeApi.create({
            title: title.trim(),
            type: 'folder',
            parent_id: parentId,
            is_subject: false
        }).then(() => {
            fetchFileTree();
            toast.success('文件夹创建成功');
        }).catch(err => {
            toast.error('创建失败: ' + err.message);
        });
    }, [fileTree, fetchFileTree, toast]);

    // 打开文件创建模态框
    const openCreateFileModal = useCallback((parentId, parentName) => {
        setCreateFileParentId(parentId);
        setCreateFileParentName(parentName || '根目录');
        setShowCreateFileModal(true);
    }, []);

    // 新建空白文件
    const handleNewBlankFile = useCallback(() => {
        setActiveFile(null);
        setEditContent('');
        setNewNoteName('');
        setSearchParams({});
        setViewMode('edit');
        setEditMode('live');
    }, [setSearchParams]);

    // 搜索过滤，分离草稿箱和普通笔记
    const { draftBox, notesTree } = useMemo(() => {
        // 找出草稿箱
        const draft = fileTree.find(node => node.id === draftBoxId);
        // 其他笔记（不含草稿箱）
        const notes = fileTree.filter(node => node.id !== draftBoxId);

        if (!debouncedSearch) {
            return { draftBox: draft, notesTree: notes };
        }

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

        return {
            draftBox: draft ? (draft.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || (draft.children?.length > 0 && filterTree(draft.children).length > 0) ? { ...draft, children: draft.children ? filterTree(draft.children) : undefined } : null) : null,
            notesTree: filterTree(notes)
        };
    }, [fileTree, debouncedSearch, draftBoxId]);

    // 兼容旧代码，保持 displayTree 引用
    const displayTree = notesTree;

    // toast 回调
    const handleToast = useCallback((type, message) => {
        toast[type]?.(message);
    }, [toast]);

    // 获取所有笔记列表（用于双链）
    const allNotes = useMemo(() => {
        const notes = [];
        const collectNotes = (nodes) => {
            for (const node of nodes) {
                if (node.type === 'file') {
                    notes.push({ id: node.id, title: node.title });
                }
                if (node.children) {
                    collectNotes(node.children);
                }
            }
        };
        collectNotes(fileTree);
        return notes;
    }, [fileTree]);

    // 双链点击处理
    const handleWikiLinkClick = useCallback(async (noteName) => {
        // 查找笔记
        const note = allNotes.find(n => n.title?.toLowerCase() === noteName.toLowerCase());

        if (note) {
            // 笔记存在，跳转
            setSearchParams({ id: note.id });
            try {
                const fullData = await fileTreeApi.getById(note.id);
                setActiveFile(fullData);
                setEditContent(fullData.content || '');
                setViewMode('read'); // 打开时进入阅读模式
            } catch (err) {
                toast.error('加载笔记失败');
            }
        } else {
            // 笔记不存在，创建新笔记
            const confirmCreate = window.confirm(`笔记 "${noteName}" 不存在，是否创建？`);
            if (confirmCreate) {
                try {
                    const newFile = await fileTreeApi.create({
                        title: noteName,
                        type: 'file',
                        parent_id: null,
                        content: `# ${noteName}\n\n`
                    });
                    fetchFileTree();
                    setSearchParams({ id: newFile.id });
                    setActiveFile({ id: newFile.id, title: noteName, type: 'file', content: `# ${noteName}\n\n` });
                    setEditContent(`# ${noteName}\n\n`);
                    setViewMode('edit'); // 新建笔记进入编辑模式
                    setEditMode('live'); // 默认阅览模式
                    toast.success('笔记创建成功');
                } catch (err) {
                    toast.error('创建笔记失败: ' + err.message);
                }
            }
        }
    }, [allNotes, setSearchParams, fetchFileTree, toast]);

    // 工具栏插入文本（支持toggle模式）
    const handleToolbarInsert = useCallback((prefix, suffix, placeholder, toggle = false) => {
        if (editorRef.current?.insertText) {
            editorRef.current.insertText(prefix, suffix, placeholder, toggle);
        }
    }, []);

    // 获取编辑器当前选中的文本
    const handleGetSelection = useCallback(() => {
        if (editorRef.current?.getSelection) {
            return editorRef.current.getSelection();
        }
        return '';
    }, []);

    if (loading) {
        return (
            <div className="relative w-full min-h-screen text-slate-800 font-sans p-6">
                <div className="fixed inset-0 z-0 bg-slate-50/40"></div>
                <div className="relative z-10 flex items-center justify-center h-screen">
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/60">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-700 font-medium">正在加载知识库...</p>
                                <p className="text-sm text-slate-400 mt-1">请稍候</p>
                            </div>
                        </div>
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
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}
            />
            <div className="fixed inset-0 z-0 bg-slate-50/40" />

            {/* 头部导航 */}
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">知识库</h1>
                        <p className="text-sm text-slate-500">管理你的笔记和文档</p>
                    </div>
                </div>

                {/* 快捷操作 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-md border border-white/60 rounded-xl text-sm text-slate-600 transition-colors shadow-sm"
                    >
                        <Upload size={16} /> 导入笔记
                    </button>
                    <button
                        onClick={handleNewBlankFile}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-md border border-white/60 rounded-xl text-sm text-slate-600 transition-colors shadow-sm"
                    >
                        <Plus size={16} /> 新建笔记
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-6 gap-6 flex-1">

                {/* 左侧文件树 */}
                <div className="lg:col-span-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                        <div className="h-5 w-1 rounded-full bg-indigo-500"></div>
                        <h3 className="font-bold text-slate-700">文件目录</h3>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="p-3 border-b border-white/40 bg-white/20 space-y-2 shrink-0">
                            {/* 搜索框 */}
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

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateFolderModal(true)}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/50 hover:bg-white border border-white/50 rounded-lg text-xs text-slate-600 transition-colors"
                                >
                                    <FolderPlus size={14} /> 文件夹
                                </button>
                                <button
                                    onClick={() => openCreateFileModal(null, '根目录')}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/50 hover:bg-white border border-white/50 rounded-lg text-xs text-slate-600 transition-colors"
                                >
                                    <FilePlus size={14} /> 文件
                                </button>
                            </div>
                        </div>

                        {/* 剪贴板提示 */}
                        {clipboard && (
                            <div className="mx-3 mt-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-xs">
                                <span className="text-blue-600 truncate">已剪切: {clipboard.title}</span>
                                <button
                                    onClick={() => setClipboard(null)}
                                    className="text-blue-400 hover:text-blue-600 ml-2"
                                >
                                    取消
                                </button>
                            </div>
                        )}

                        {/* 文件树 */}
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {(!draftBox && notesTree.length === 0) ? (
                                <div className="text-center py-8 px-4">
                                    {debouncedSearch ? (
                                        <div className="space-y-2">
                                            <Search size={32} className="mx-auto text-slate-300" />
                                            <p className="text-slate-500">未找到 "{debouncedSearch}"</p>
                                            <p className="text-xs text-slate-400">尝试其他关键词</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                                                <FolderPlus size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 font-medium">知识库为空</p>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                点击上方按钮创建文件夹或文件<br />
                                                开始记录你的学习笔记吧！
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* 草稿箱 - 在虚拟笔记文件夹上方 */}
                                    {draftBox && (
                                        <div className="mb-1">
                                            <FileTreeItem
                                                node={draftBox}
                                                level={0}
                                                activeId={activeFile?.id}
                                                onSelect={handleSelectFile}
                                                onRefresh={fetchFileTree}
                                                onToast={handleToast}
                                                onCreateFile={handleInlineCreateFile}
                                                onCreateFolder={handleCreateSubFolder}
                                                clipboard={clipboard}
                                                onCut={handleCutNode}
                                                onPaste={handlePasteNode}
                                                onDragMove={handleMoveNode}
                                            />
                                        </div>
                                    )}
                                    {/* 虚拟"笔记"根文件夹 */}
                                    {notesTree.length > 0 && (
                                        <div className="mb-1">
                                            <div
                                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50/80 cursor-pointer select-none"
                                                onClick={() => setNotesExpanded(!notesExpanded)}
                                            >
                                                {notesExpanded ? (
                                                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                                ) : (
                                                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                                )}
                                                <FolderOpen size={16} className="text-indigo-500 shrink-0" />
                                                <span className="text-sm font-medium text-slate-700 truncate">笔记</span>
                                                <span className="ml-auto text-xs text-slate-400">{notesTree.length}</span>
                                            </div>
                                            {notesExpanded && (
                                                <div className="ml-2 border-l border-slate-200/60 pl-1">
                                                    {notesTree.map(node => (
                                                        <FileTreeItem
                                                            key={node.id}
                                                            node={node}
                                                            level={0}
                                                            activeId={activeFile?.id}
                                                            onSelect={handleSelectFile}
                                                            onRefresh={fetchFileTree}
                                                            onToast={handleToast}
                                                            onCreateFile={handleInlineCreateFile}
                                                            onCreateFolder={handleCreateSubFolder}
                                                            clipboard={clipboard}
                                                            onCut={handleCutNode}
                                                            onPaste={handlePasteNode}
                                                            onDragMove={handleMoveNode}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 右侧编辑区 */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-emerald-500"></div>
                            <h3 className="font-bold text-slate-700">{activeFile ? activeFile.title : '新建笔记'}</h3>
                            {activeFile && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${viewMode === 'read'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : editMode === 'live'
                                        ? 'bg-indigo-100 text-indigo-600'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {viewMode === 'read' ? '阅读中' : editMode === 'live' ? '阅览编辑' : '源码编辑'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex-1 flex flex-col">
                        {/* 阅读模式 - 选中笔记时的默认模式 */}
                        {viewMode === 'read' && activeFile ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* 阅读模式顶栏 - 无工具条 */}
                                <div className="px-4 py-2.5 bg-white/30 text-xs font-medium text-slate-500 border-b border-white/40 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} />
                                        <span>阅读模式</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Link2 size={12} />
                                        <span>支持 [[双链]] 和 $数学公式$</span>
                                    </div>
                                </div>
                                {/* 纯渲染显示 - 不展示 Markdown 源代码 */}
                                <div className="flex-1 p-6 overflow-y-auto prose prose-slate prose-lg max-w-none">
                                    <MarkdownPreview
                                        content={editContent}
                                        existingNotes={allNotes}
                                        onWikiLinkClick={handleWikiLinkClick}
                                    />
                                </div>
                                {/* 底部"编辑模式"按钮 */}
                                <div className="p-4 border-t border-white/40 bg-white/20 flex items-center justify-center shrink-0">
                                    <button
                                        onClick={() => {
                                            setViewMode('edit');
                                            setEditMode('live'); // 默认进入阅览模式
                                        }}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
                                    >
                                        <Pencil size={16} /> 进入编辑模式
                                    </button>
                                </div>
                            </div>
                        ) : viewMode === 'edit' ? (
                            /* 编辑模式 */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* 编辑工具条 - 仅在编辑模式下显示 */}
                                <EditorToolbar
                                    editMode={editMode}
                                    onEditModeChange={setEditMode}
                                    onInsert={handleToolbarInsert}
                                    getSelection={handleGetSelection}
                                />

                                {/* 编辑器区域 */}
                                <div className="flex-1 flex overflow-hidden">
                                    {editMode === 'live' ? (
                                        /* 阅览模式 (Live Preview) - 默认子模式 */
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <LivePreviewEditor
                                                ref={editorRef}
                                                content={editContent}
                                                onChange={setEditContent}
                                                onSave={activeFile ? handleSaveToFile : undefined}
                                                editMode={editMode}
                                            />
                                        </div>
                                    ) : (
                                        /* 源代码模式 - 纯文本编辑 */
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                className="flex-1 p-6 bg-transparent text-sm text-slate-700 resize-none outline-none font-mono leading-relaxed"
                                                placeholder="使用 Markdown 语法书写笔记..."
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    // Ctrl+S 保存
                                                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                                                        e.preventDefault();
                                                        if (activeFile) {
                                                            handleSaveToFile();
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 底部操作栏 */}
                                <div className="p-4 border-t border-white/40 bg-white/20 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 hidden sm:inline">
                                            Ctrl+S 保存 | [[双链]] $公式$
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        {activeFile && (
                                            <button
                                                onClick={() => setViewMode('read')}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm flex items-center gap-2 transition-colors"
                                            >
                                                <BookOpen size={16} /> 返回阅读
                                            </button>
                                        )}
                                        {activeFile ? (
                                            <button
                                                onClick={() => handleSaveToFile()}
                                                disabled={saving || !editContent.trim()}
                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Save size={16} /> {saving ? '保存中...' : '保存'}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleSaveAsNote}
                                                    disabled={saving || !editContent.trim()}
                                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Save size={16} /> 保存为笔记
                                                </button>
                                                <button
                                                    onClick={handleSaveAsDraft}
                                                    disabled={saving || !editContent.trim()}
                                                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Inbox size={16} /> 保存为草稿
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* 无文件选中时的新建模式 */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* 笔记名称输入框 */}
                                <div className="px-4 py-3 bg-white/30 border-b border-white/40 flex items-center gap-3">
                                    <FileText size={18} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="请输入笔记名称..."
                                        value={newNoteName}
                                        onChange={(e) => setNewNoteName(e.target.value)}
                                        className={`flex-1 bg-transparent text-lg font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all
                                            ${nameInputShake ? 'text-red-500 placeholder:text-red-400 animate-shake' : ''}`}
                                    />
                                </div>
                                <EditorToolbar
                                    editMode={editMode}
                                    onEditModeChange={setEditMode}
                                    onInsert={handleToolbarInsert}
                                    getSelection={handleGetSelection}
                                />
                                <div className="flex-1 flex overflow-hidden">
                                    {editMode === 'live' ? (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <LivePreviewEditor
                                                ref={editorRef}
                                                content={editContent}
                                                onChange={setEditContent}
                                                editMode={editMode}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                className="flex-1 p-6 bg-transparent text-sm text-slate-700 resize-none outline-none font-mono leading-relaxed"
                                                placeholder="使用 Markdown 语法书写笔记..."
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-white/40 bg-white/20 flex items-center justify-end shrink-0">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveAsNote}
                                            disabled={saving || !editContent.trim()}
                                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save size={16} /> 保存为笔记
                                        </button>
                                        <button
                                            onClick={handleSaveAsDraft}
                                            disabled={saving || !editContent.trim()}
                                            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Inbox size={16} /> 保存为草稿
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 模态框 */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onConfirm={handleCreateFolder}
                folders={fileTree}
            />

            <CreateFileModal
                isOpen={showCreateFileModal}
                onClose={() => setShowCreateFileModal(false)}
                onConfirm={handleCreateFile}
                parentFolder={createFileParentName}
            />

            <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={fetchFileTree}
                folders={fileTree}
            />

            {/* 摇晃动画样式 */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
