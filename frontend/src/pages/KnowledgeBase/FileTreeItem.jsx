import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
    Folder, FileText, ChevronRight, ChevronDown,
    Trash2, Edit3, Tag, MoreVertical, Inbox, Archive,
    FilePlus, FolderPlus, Copy, Scissors, GripVertical
} from 'lucide-react';
import { fileTreeApi } from '../../api';

// 文件树节点组件
const FileTreeItem = memo(({
    node,
    level,
    activeId,
    onSelect,
    onRefresh,
    onToast,
    onCreateFile,
    onCreateFolder,
    clipboard,
    onCut,
    onPaste,
    onDragMove
}) => {
    const [isOpen, setIsOpen] = useState(level < 1 || node.is_system);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(node.title);
    const [isDragOver, setIsDragOver] = useState(false);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    const isFolder = node.type === 'folder';
    const isSystemDraftBox = node.is_system && node.title === '草稿箱';
    const isActive = activeId === node.id;
    const isCut = clipboard?.id === node.id;

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    // 重命名时自动聚焦
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleToggle = useCallback((e) => {
        e.stopPropagation();
        if (isFolder) {
            setIsOpen(prev => !prev);
        } else {
            onSelect(node);
        }
    }, [isFolder, node, onSelect]);

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        if (!node.is_system && !isRenaming) {
            setIsRenaming(true);
            setNewName(node.title);
        }
    }, [node.is_system, isRenaming, node.title]);

    const handleRename = useCallback(async () => {
        if (!newName.trim() || newName === node.title) {
            setIsRenaming(false);
            return;
        }
        try {
            await fileTreeApi.update(node.id, { title: newName.trim() });
            onRefresh();
            setIsRenaming(false);
            onToast?.('success', '重命名成功');
        } catch (err) {
            onToast?.('error', '重命名失败: ' + err.message);
        }
    }, [newName, node.id, node.title, onRefresh, onToast]);

    const handleDelete = useCallback(async () => {
        if (node.is_system) return onToast?.('warning', '系统文件夹不可删除');
        if (!window.confirm(`确定删除 "${node.title}" 吗？${isFolder ? '（包含所有子文件）' : ''}`)) return;
        try {
            await fileTreeApi.delete(node.id);
            onRefresh();
            onToast?.('success', '删除成功');
        } catch (err) {
            onToast?.('error', '删除失败: ' + err.message);
        }
    }, [node.is_system, node.title, node.id, isFolder, onRefresh, onToast]);

    const handleToggleSubject = useCallback(async () => {
        try {
            await fileTreeApi.update(node.id, { is_subject: !node.is_subject });
            onRefresh();
            onToast?.('success', node.is_subject ? '已取消学科标记' : '已设为学科');
        } catch (err) {
            onToast?.('error', '操作失败: ' + err.message);
        }
    }, [node.id, node.is_subject, onRefresh, onToast]);

    // 获取文件夹图标
    const getFolderIcon = () => {
        if (isSystemDraftBox) {
            return <Inbox size={16} className="text-orange-500 flex-shrink-0" />;
        }
        if (node.title === '草稿箱') {
            return <Archive size={16} className="text-slate-400 flex-shrink-0" />;
        }
        return <Folder size={16} className={`flex-shrink-0 ${node.is_subject ? 'text-indigo-500' : 'text-slate-400'}`} />;
    };

    // 右键菜单
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!node.is_system) {
            setShowMenu(true);
        }
    }, [node.is_system]);

    // 键盘快捷键处理
    const handleKeyDown = useCallback((e) => {
        if (isRenaming) return; // 重命名中不处理快捷键

        switch (e.key) {
            case 'F2': // 重命名
                e.preventDefault();
                if (!node.is_system) {
                    setIsRenaming(true);
                    setNewName(node.title);
                }
                break;
            case 'Delete': // 删除
                e.preventDefault();
                if (!node.is_system) {
                    handleDelete();
                }
                break;
            case 'Enter': // 打开/展开
                e.preventDefault();
                if (isFolder) {
                    setIsOpen(prev => !prev);
                } else {
                    onSelect(node);
                }
                break;
            case 'ArrowRight': // 展开文件夹
                if (isFolder && !isOpen) {
                    e.preventDefault();
                    setIsOpen(true);
                }
                break;
            case 'ArrowLeft': // 折叠文件夹
                if (isFolder && isOpen) {
                    e.preventDefault();
                    setIsOpen(false);
                }
                break;
        }
    }, [isRenaming, node, isFolder, isOpen, onSelect, handleDelete]);

    // 拖拽开始
    const handleDragStart = useCallback((e) => {
        if (node.is_system) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id, title: node.title, type: node.type }));
        e.dataTransfer.effectAllowed = 'move';
    }, [node]);

    // 拖拽经过
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (isFolder && !node.is_system) {
            e.dataTransfer.dropEffect = 'move';
            setIsDragOver(true);
        }
    }, [isFolder, node.is_system]);

    // 拖拽离开
    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    // 放置
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!isFolder) return;

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.id !== node.id) {
                onDragMove?.(data.id, node.id);
            }
        } catch (err) {
            console.error('Drop error:', err);
        }
    }, [isFolder, node.id, onDragMove]);

    return (
        <div className="select-none">
            <div
                className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all relative
                    ${isActive ? 'bg-indigo-50/80 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-white/50'}
                    ${isCut ? 'opacity-50' : ''}
                    ${isDragOver ? 'bg-indigo-100 ring-2 ring-indigo-300 ring-inset' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={handleToggle}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                draggable={!node.is_system && !isRenaming}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {/* 展开/折叠图标 - 文件夹显示箭头，文件显示空占位保持对齐 */}
                <span className="text-slate-400 w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {isFolder ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                </span>

                {/* 文件/文件夹图标 */}
                <span className="flex-shrink-0">
                    {isFolder ? getFolderIcon() : (
                        <FileText size={16} className="text-slate-400" />
                    )}
                </span>

                {/* 名称 */}
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        className="flex-1 text-sm bg-white border border-indigo-300 rounded px-1.5 py-0.5 outline-none min-w-0"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') {
                                setIsRenaming(false);
                                setNewName(node.title);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`text-sm truncate flex-1 min-w-0 ${isSystemDraftBox ? 'text-orange-600 font-medium' : ''}`}>
                        {node.title}
                    </span>
                )}

                {/* 学科标记 */}
                {node.is_subject && !node.is_system && (
                    <Tag size={12} className="text-indigo-400 flex-shrink-0" />
                )}

                {/* 更多操作按钮 */}
                {!node.is_system && (
                    <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-opacity flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(prev => !prev); }}
                    >
                        <MoreVertical size={14} className="text-slate-400" />
                    </button>
                )}

                {/* 右键/更多菜单 */}
                {showMenu && !node.is_system && (
                    <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isFolder && (
                            <>
                                <button
                                    className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    onClick={() => {
                                        const title = prompt(`在 "${node.title}" 中创建文件\n请输入文件名：`);
                                        if (title?.trim()) {
                                            onCreateFile?.(node.id, title.trim());
                                        }
                                        setShowMenu(false);
                                    }}
                                >
                                    <FilePlus size={14} /> 新建文件
                                </button>
                                <button
                                    className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    onClick={() => { onCreateFolder?.(node.id); setShowMenu(false); }}
                                >
                                    <FolderPlus size={14} /> 新建文件夹
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                            </>
                        )}
                        <button
                            className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            onClick={() => { setIsRenaming(true); setShowMenu(false); }}
                        >
                            <Edit3 size={14} /> 重命名
                        </button>
                        <button
                            className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            onClick={() => { onCut?.(node); setShowMenu(false); }}
                        >
                            <Scissors size={14} /> 剪切
                        </button>
                        {isFolder && clipboard && (
                            <button
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => { onPaste?.(node.id); setShowMenu(false); }}
                            >
                                <Copy size={14} /> 粘贴到此
                            </button>
                        )}
                        {isFolder && (
                            <button
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => { handleToggleSubject(); setShowMenu(false); }}
                            >
                                <Tag size={14} /> {node.is_subject ? '取消学科' : '设为学科'}
                            </button>
                        )}
                        <div className="border-t border-slate-100 my-1" />
                        <button
                            className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => { handleDelete(); setShowMenu(false); }}
                        >
                            <Trash2 size={14} /> 删除
                        </button>
                    </div>
                )}
            </div>

            {/* 子节点 */}
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
                            onToast={onToast}
                            onCreateFile={onCreateFile}
                            onCreateFolder={onCreateFolder}
                            clipboard={clipboard}
                            onCut={onCut}
                            onPaste={onPaste}
                            onDragMove={onDragMove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

FileTreeItem.displayName = 'FileTreeItem';

export default FileTreeItem;
