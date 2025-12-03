import React, { useState, useRef, useEffect, memo } from 'react';
import { Save, Eye, Edit3, Bold, Italic, Link, List, ListOrdered, Quote, Code, Image, Heading1, Heading2, Heading3, Undo, Redo, HelpCircle } from 'lucide-react';

// 工具栏按钮组件
const ToolbarButton = memo(({ icon: Icon, title, onClick, isActive }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'}`}
    >
        <Icon size={18} />
    </button>
));

// 工具栏分隔符
const ToolbarDivider = () => <div className="w-px h-6 bg-slate-200 mx-1" />;

// Markdown 编辑器组件
const MarkdownEditor = memo(({ 
    content, 
    onChange, 
    onSave, 
    isSaving = false,
    title = '',
    onTitleChange,
    readOnly = false,
    showPreview = false,
    onTogglePreview
}) => {
    const [localContent, setLocalContent] = useState(content || '');
    const [showHelp, setShowHelp] = useState(false);
    const textareaRef = useRef(null);
    const historyRef = useRef({ past: [], future: [] });

    // 同步外部内容变化
    useEffect(() => {
        if (content !== localContent) {
            setLocalContent(content || '');
            historyRef.current = { past: [], future: [] };
        }
    }, [content]);

    // 自动保存提示
    const hasUnsavedChanges = content !== localContent;

    // 插入 Markdown 格式
    const insertFormat = (prefix, suffix = '', placeholder = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = localContent.substring(start, end);
        const textToInsert = selectedText || placeholder;
        
        const newContent = 
            localContent.substring(0, start) + 
            prefix + textToInsert + suffix + 
            localContent.substring(end);

        // 保存历史
        historyRef.current.past.push(localContent);
        historyRef.current.future = [];

        setLocalContent(newContent);
        onChange?.(newContent);

        // 设置光标位置
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
            } else {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
            }
        }, 0);
    };

    // 撤销/重做
    const undo = () => {
        if (historyRef.current.past.length === 0) return;
        const previous = historyRef.current.past.pop();
        historyRef.current.future.push(localContent);
        setLocalContent(previous);
        onChange?.(previous);
    };

    const redo = () => {
        if (historyRef.current.future.length === 0) return;
        const next = historyRef.current.future.pop();
        historyRef.current.past.push(localContent);
        setLocalContent(next);
        onChange?.(next);
    };

    // 处理内容变化
    const handleContentChange = (e) => {
        const newContent = e.target.value;
        historyRef.current.past.push(localContent);
        historyRef.current.future = [];
        if (historyRef.current.past.length > 50) {
            historyRef.current.past.shift();
        }
        setLocalContent(newContent);
        onChange?.(newContent);
    };

    // 处理保存
    const handleSave = () => {
        onSave?.(localContent);
    };

    // 快捷键处理
    const handleKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    handleSave();
                    break;
                case 'b':
                    e.preventDefault();
                    insertFormat('**', '**', '粗体文字');
                    break;
                case 'i':
                    e.preventDefault();
                    insertFormat('*', '*', '斜体文字');
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
            }
        }
    };

    // 工具栏配置
    const toolbarItems = [
        { icon: Undo, title: '撤销 (Ctrl+Z)', onClick: undo },
        { icon: Redo, title: '重做 (Ctrl+Y)', onClick: redo },
        'divider',
        { icon: Heading1, title: '一级标题', onClick: () => insertFormat('# ', '', '标题') },
        { icon: Heading2, title: '二级标题', onClick: () => insertFormat('## ', '', '标题') },
        { icon: Heading3, title: '三级标题', onClick: () => insertFormat('### ', '', '标题') },
        'divider',
        { icon: Bold, title: '粗体 (Ctrl+B)', onClick: () => insertFormat('**', '**', '粗体文字') },
        { icon: Italic, title: '斜体 (Ctrl+I)', onClick: () => insertFormat('*', '*', '斜体文字') },
        { icon: Code, title: '行内代码', onClick: () => insertFormat('`', '`', 'code') },
        'divider',
        { icon: Link, title: '链接', onClick: () => insertFormat('[', '](url)', '链接文字') },
        { icon: Image, title: '图片', onClick: () => insertFormat('![', '](url)', '图片描述') },
        'divider',
        { icon: List, title: '无序列表', onClick: () => insertFormat('- ', '', '列表项') },
        { icon: ListOrdered, title: '有序列表', onClick: () => insertFormat('1. ', '', '列表项') },
        { icon: Quote, title: '引用', onClick: () => insertFormat('> ', '', '引用内容') },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-0.5">
                    {toolbarItems.map((item, index) => 
                        item === 'divider' 
                            ? <ToolbarDivider key={index} />
                            : <ToolbarButton key={index} {...item} />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={`p-2 rounded-lg transition-colors ${showHelp ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                        title="Markdown 帮助"
                    >
                        <HelpCircle size={18} />
                    </button>
                    
                    {onTogglePreview && (
                        <button
                            onClick={onTogglePreview}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${showPreview ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            {showPreview ? <Edit3 size={16} /> : <Eye size={16} />}
                            <span className="text-sm">{showPreview ? '编辑' : '预览'}</span>
                        </button>
                    )}

                    {hasUnsavedChanges && (
                        <span className="text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded">未保存</span>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving || readOnly}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={16} />
                        <span className="text-sm">{isSaving ? '保存中...' : '保存'}</span>
                    </button>
                </div>
            </div>

            {/* 标题输入 */}
            {onTitleChange && (
                <div className="px-6 py-3 border-b border-slate-100">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="输入标题..."
                        className="w-full text-xl font-semibold text-slate-800 placeholder-slate-300 outline-none"
                        readOnly={readOnly}
                    />
                </div>
            )}

            {/* 编辑区域 */}
            <div className="flex-1 relative overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={localContent}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    placeholder="开始写作..."
                    readOnly={readOnly}
                    className="w-full h-full px-6 py-4 text-slate-700 leading-relaxed resize-none outline-none font-mono text-sm"
                    style={{ tabSize: 4 }}
                />

                {/* Markdown 帮助面板 */}
                {showHelp && (
                    <div className="absolute top-4 right-4 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-10">
                        <h4 className="font-semibold text-slate-800 mb-3">Markdown 语法</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <code className="text-indigo-600"># 标题</code>
                                <span className="text-slate-400">一级标题</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">**粗体**</code>
                                <span className="text-slate-400">粗体文字</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">*斜体*</code>
                                <span className="text-slate-400">斜体文字</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">[文字](url)</code>
                                <span className="text-slate-400">链接</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">![描述](url)</code>
                                <span className="text-slate-400">图片</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">`代码`</code>
                                <span className="text-slate-400">行内代码</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">- 列表</code>
                                <span className="text-slate-400">无序列表</span>
                            </div>
                            <div className="flex justify-between">
                                <code className="text-indigo-600">&gt; 引用</code>
                                <span className="text-slate-400">引用</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                            快捷键: Ctrl+S 保存, Ctrl+B 粗体, Ctrl+I 斜体
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
