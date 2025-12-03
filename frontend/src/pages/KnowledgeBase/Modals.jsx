import React, { useState, useRef, useEffect } from 'react';
import { X, Folder, ChevronRight, ChevronDown } from 'lucide-react';

// 文件夹选择树组件
const FolderSelectTree = ({ folders, selectedId, onSelect, level = 0 }) => {
    return (
        <div className="space-y-0.5">
            {folders.map(folder => (
                <FolderSelectItem
                    key={folder.id}
                    folder={folder}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    level={level}
                />
            ))}
        </div>
    );
};

const FolderSelectItem = ({ folder, selectedId, onSelect, level }) => {
    const [isOpen, setIsOpen] = useState(level < 2);
    const hasChildren = folder.children?.some(c => c.type === 'folder');
    const isSelected = selectedId === folder.id;

    return (
        <div>
            <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(folder.id)}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-0.5 hover:bg-white rounded"
                    >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <span className="w-5" />
                )}
                <Folder size={16} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                <span className="text-sm truncate">{folder.title}</span>
            </div>
            {hasChildren && isOpen && (
                <FolderSelectTree
                    folders={folder.children.filter(c => c.type === 'folder')}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    level={level + 1}
                />
            )}
        </div>
    );
};

// 创建文件夹模态框
export const CreateFolderModal = ({ isOpen, onClose, onConfirm, folders }) => {
    const [title, setTitle] = useState('');
    const [parentId, setParentId] = useState(null);
    const [isSubject, setIsSubject] = useState(false);
    const [showFolderSelect, setShowFolderSelect] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!title.trim()) return;
        onConfirm({
            title: title.trim(),
            parent_id: parentId,
            is_subject: isSubject
        });
        setTitle('');
        setParentId(null);
        setIsSubject(false);
    };

    const getSelectedFolderName = () => {
        if (!parentId) return '根目录';
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
        return findFolder(folders) || '根目录';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">新建文件夹</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">名称</label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                            placeholder="输入文件夹名称"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">位置</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowFolderSelect(!showFolderSelect)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <Folder size={16} className="text-slate-400" />
                                    {getSelectedFolderName()}
                                </span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${showFolderSelect ? 'rotate-180' : ''}`} />
                            </button>
                            {showFolderSelect && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                                            ${!parentId ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                        onClick={() => { setParentId(null); setShowFolderSelect(false); }}
                                    >
                                        <Folder size={16} className={!parentId ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="text-sm">根目录</span>
                                    </div>
                                    <FolderSelectTree
                                        folders={folders.filter(f => f.type === 'folder' && !f.is_system)}
                                        selectedId={parentId}
                                        onSelect={(id) => { setParentId(id); setShowFolderSelect(false); }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isSubject"
                            checked={isSubject}
                            onChange={(e) => setIsSubject(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-200"
                        />
                        <label htmlFor="isSubject" className="text-sm text-slate-600">
                            设为学科分类（可在下拉选择中选择）
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        创建
                    </button>
                </div>
            </div>
        </div>
    );
};

// 创建文件模态框
export const CreateFileModal = ({ isOpen, onClose, onConfirm, parentFolder }) => {
    const [title, setTitle] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTitle('');
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!title.trim()) return;
        onConfirm(title.trim());
        setTitle('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">新建文件</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">文件名</label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                            placeholder="输入文件名称"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    </div>

                    {parentFolder && (
                        <div className="text-sm text-slate-500">
                            将在 <span className="font-medium text-slate-700">{parentFolder}</span> 中创建
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        创建
                    </button>
                </div>
            </div>
        </div>
    );
};

export default { CreateFolderModal, CreateFileModal };
