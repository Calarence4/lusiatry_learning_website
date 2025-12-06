import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FolderOpen, FileText, Check, AlertCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

// 支持的文件格式
const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.markdown'];

// 解析文件内容
const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
    });
};

// 获取文件相对路径（保留完整路径包括根文件夹）
const getRelativePath = (file) => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    // 保留完整路径（不包括文件名本身）
    if (parts.length > 1) {
        return parts.slice(0, -1).join('/');
    }
    return '';
};

// 获取不带扩展名的文件名
const getFileNameWithoutExt = (fileName) => {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
};

// 检查文件是否支持
const isSupportedFile = (fileName) => {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return SUPPORTED_EXTENSIONS.includes(ext);
};

// 文件项组件
const FileItem = ({ item, selected, onToggle }) => {
    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                }`}
            onClick={() => onToggle(item.id)}
        >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                }`}>
                {selected && <Check size={14} className="text-white" />}
            </div>
            <FileText size={16} className="text-slate-400" />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">{item.title}</div>
                {item.path && (
                    <div className="text-xs text-slate-400 truncate">{item.path}</div>
                )}
            </div>
            <div className="text-xs text-slate-400">
                {(item.content?.length || 0).toLocaleString()} 字符
            </div>
        </div>
    );
};

// 文件夹组件（可折叠）
const FolderGroup = ({ path, items, selectedIds, onToggle }) => {
    const [expanded, setExpanded] = useState(true);
    const folderItems = items.filter(i => i.path === path);
    const allSelected = folderItems.every(i => selectedIds.has(i.id));
    const someSelected = folderItems.some(i => selectedIds.has(i.id));

    const handleToggleAll = () => {
        folderItems.forEach(item => {
            if (allSelected) {
                onToggle(item.id, false);
            } else {
                onToggle(item.id, true);
            }
        });
    };

    return (
        <div className="mb-2">
            <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <FolderOpen size={16} className="text-amber-500" />
                <span className="text-sm font-medium text-slate-600 flex-1">{path || '根目录'}</span>
                <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-indigo-500 border-indigo-500' : someSelected ? 'bg-indigo-200 border-indigo-300' : 'border-slate-300'
                        }`}
                    onClick={(e) => { e.stopPropagation(); handleToggleAll(); }}
                >
                    {allSelected && <Check size={14} className="text-white" />}
                    {someSelected && !allSelected && <div className="w-2 h-2 bg-indigo-500 rounded-sm" />}
                </div>
                <span className="text-xs text-slate-400">{folderItems.length} 个文件</span>
            </div>
            {expanded && (
                <div className="ml-6 space-y-1 mt-1">
                    {folderItems.map(item => (
                        <FileItem
                            key={item.id}
                            item={item}
                            selected={selectedIds.has(item.id)}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ImportModal({ isOpen, onClose, onImportComplete, folders = [] }) {
    const [step, setStep] = useState('select'); // 'select' | 'preview' | 'importing' | 'result'
    const [parsedFiles, setParsedFiles] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [targetFolderId, setTargetFolderId] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState(null);
    const [parsing, setParsing] = useState(false);

    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);

    // 重置状态
    const resetState = useCallback(() => {
        setStep('select');
        setParsedFiles([]);
        setSelectedIds(new Set());
        setTargetFolderId(null);
        setImportResult(null);
        setError(null);
        setParsing(false);
    }, []);

    // 处理文件选择
    const handleFilesSelected = useCallback(async (files) => {
        if (!files || files.length === 0) return;

        setParsing(true);
        setError(null);

        try {
            const fileArray = Array.from(files);
            const supportedFiles = fileArray.filter(f => isSupportedFile(f.name));

            if (supportedFiles.length === 0) {
                setError('没有找到支持的文件格式（.md, .txt, .markdown）');
                setParsing(false);
                return;
            }

            const parsed = await Promise.all(
                supportedFiles.map(async (file, index) => {
                    try {
                        const content = await readFileContent(file);
                        return {
                            id: `file-${index}-${Date.now()}`,
                            title: getFileNameWithoutExt(file.name),
                            content: content,
                            path: getRelativePath(file),
                            type: 'file',
                            originalName: file.name,
                            size: file.size
                        };
                    } catch (err) {
                        console.error(`读取文件失败: ${file.name}`, err);
                        return null;
                    }
                })
            );

            const validFiles = parsed.filter(Boolean);
            setParsedFiles(validFiles);
            setSelectedIds(new Set(validFiles.map(f => f.id)));
            setStep('preview');
        } catch (err) {
            setError('解析文件时出错: ' + err.message);
        } finally {
            setParsing(false);
        }
    }, []);

    // 切换选择
    const toggleSelection = useCallback((id, forceValue) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (forceValue === true) {
                next.add(id);
            } else if (forceValue === false) {
                next.delete(id);
            } else {
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
            }
            return next;
        });
    }, []);

    // 全选/取消全选
    const toggleAll = useCallback(() => {
        if (selectedIds.size === parsedFiles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(parsedFiles.map(f => f.id)));
        }
    }, [parsedFiles, selectedIds]);

    // 执行导入
    const handleImport = useCallback(async () => {
        const selectedFiles = parsedFiles.filter(f => selectedIds.has(f.id));
        if (selectedFiles.length === 0) return;

        setStep('importing');
        setError(null);

        try {
            const { fileTreeApi } = await import('../../api');
            const result = await fileTreeApi.batchImport({
                items: selectedFiles.map(f => ({
                    title: f.title,
                    content: f.content,
                    type: f.type,
                    path: f.path
                })),
                targetFolderId: targetFolderId
            });

            setImportResult(result);
            setStep('result');

            if (result.success > 0) {
                onImportComplete?.();
            }
        } catch (err) {
            setError('导入失败: ' + err.message);
            setStep('preview');
        }
    }, [parsedFiles, selectedIds, targetFolderId, onImportComplete]);

    // 按路径分组文件
    const groupedByPath = React.useMemo(() => {
        const paths = new Set(parsedFiles.map(f => f.path));
        return Array.from(paths).sort();
    }, [parsedFiles]);

    // 获取扁平化的文件夹列表
    const flatFolders = React.useMemo(() => {
        const result = [];
        const flatten = (nodes, depth = 0) => {
            for (const node of nodes) {
                if (node.type === 'folder' && !node.is_system) {
                    result.push({ ...node, depth });
                    if (node.children) {
                        flatten(node.children, depth + 1);
                    }
                }
            }
        };
        flatten(folders);
        return result;
    }, [folders]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { resetState(); onClose(); }} />

            {/* 模态框 */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Upload size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">导入本地笔记</h2>
                            <p className="text-xs text-slate-500">支持 .md, .txt, .markdown 格式</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { resetState(); onClose(); }}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 内容区 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* 步骤1: 选择文件 */}
                    {step === 'select' && (
                        <div className="space-y-6">
                            {error && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {/* 选择文件 */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FileText size={24} className="text-slate-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-slate-700">选择文件</p>
                                        <p className="text-xs text-slate-400 mt-1">选择单个或多个文件</p>
                                    </div>
                                </div>

                                {/* 选择文件夹 */}
                                <div
                                    onClick={() => folderInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                        <FolderOpen size={24} className="text-amber-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-slate-700">选择文件夹</p>
                                        <p className="text-xs text-slate-400 mt-1">保留原有目录结构</p>
                                    </div>
                                </div>
                            </div>

                            {parsing && (
                                <div className="flex items-center justify-center gap-2 py-4">
                                    <Loader2 size={20} className="animate-spin text-indigo-500" />
                                    <span className="text-slate-600">正在解析文件...</span>
                                </div>
                            )}

                            {/* 隐藏的文件输入 */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".md,.txt,.markdown"
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files)}
                            />
                            <input
                                ref={folderInputRef}
                                type="file"
                                webkitdirectory=""
                                directory=""
                                multiple
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files)}
                            />

                            <div className="text-center text-sm text-slate-500">
                                <p>提示：选择文件夹时会自动保留原有的目录层级结构</p>
                            </div>
                        </div>
                    )}

                    {/* 步骤2: 预览和选择 */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* 目标文件夹选择 */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <label className="text-sm text-slate-600 whitespace-nowrap">导入到：</label>
                                <select
                                    value={targetFolderId || ''}
                                    onChange={(e) => setTargetFolderId(e.target.value || null)}
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">根目录</option>
                                    {flatFolders.map(folder => (
                                        <option key={folder.id} value={folder.id}>
                                            {'　'.repeat(folder.depth)}{folder.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 全选控制 */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    {selectedIds.size === parsedFiles.length ? '取消全选' : '全选'}
                                </button>
                                <span className="text-sm text-slate-500">
                                    已选择 {selectedIds.size} / {parsedFiles.length} 个文件
                                </span>
                            </div>

                            {/* 文件列表 */}
                            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                                {groupedByPath.length > 1 ? (
                                    groupedByPath.map(path => (
                                        <FolderGroup
                                            key={path || 'root'}
                                            path={path}
                                            items={parsedFiles}
                                            selectedIds={selectedIds}
                                            onToggle={toggleSelection}
                                        />
                                    ))
                                ) : (
                                    parsedFiles.map(item => (
                                        <FileItem
                                            key={item.id}
                                            item={item}
                                            selected={selectedIds.has(item.id)}
                                            onToggle={toggleSelection}
                                        />
                                    ))
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 步骤3: 导入中 */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-lg font-medium text-slate-700">正在导入...</p>
                            <p className="text-sm text-slate-500 mt-1">请稍候，正在处理 {selectedIds.size} 个文件</p>
                        </div>
                    )}

                    {/* 步骤4: 导入结果 */}
                    {step === 'result' && importResult && (
                        <div className="space-y-6">
                            <div className="text-center py-6">
                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${importResult.failed === 0 ? 'bg-emerald-100' : 'bg-amber-100'
                                    }`}>
                                    {importResult.failed === 0 ? (
                                        <Check size={32} className="text-emerald-600" />
                                    ) : (
                                        <AlertCircle size={32} className="text-amber-600" />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">导入完成</h3>
                                <p className="text-slate-500 mt-2">
                                    成功导入 <span className="text-emerald-600 font-medium">{importResult.success}</span> 个文件
                                    {importResult.failed > 0 && (
                                        <>，<span className="text-red-500 font-medium">{importResult.failed}</span> 个失败</>
                                    )}
                                </p>
                            </div>

                            {importResult.errors?.length > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-red-700 mb-2">失败详情：</h4>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {importResult.errors.map((err, i) => (
                                            <li key={i}>• {err.title}: {err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 底部操作 */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    {step === 'select' && (
                        <div className="w-full text-center text-sm text-slate-400">
                            选择文件或文件夹开始导入
                        </div>
                    )}

                    {step === 'preview' && (
                        <>
                            <button
                                onClick={() => { setStep('select'); setParsedFiles([]); setSelectedIds(new Set()); }}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
                            >
                                ← 重新选择
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedIds.size === 0}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
                            >
                                导入 {selectedIds.size} 个文件
                            </button>
                        </>
                    )}

                    {step === 'result' && (
                        <button
                            onClick={() => { resetState(); onClose(); }}
                            className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors"
                        >
                            完成
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
