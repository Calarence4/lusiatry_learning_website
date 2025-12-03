import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import 'katex/dist/katex.min.css';

// 处理双链语法 [[笔记名]]
const processWikiLinks = (content, onLinkClick) => {
    if (!content) return content;
    
    // 匹配 [[笔记名]] 语法
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = wikiLinkRegex.exec(content)) !== null) {
        // 添加匹配前的普通文本
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }
        
        // 添加双链标记（将在渲染时处理）
        const noteName = match[1];
        parts.push(`[[WIKILINK:${noteName}]]`);
        lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }
    
    return parts.join('');
};

// 双链组件
const WikiLink = ({ name, exists, onClick }) => (
    <button
        onClick={() => onClick(name)}
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-sm font-medium transition-colors
            ${exists 
                ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
        title={exists ? `跳转到: ${name}` : `创建笔记: ${name}`}
    >
        <span className="text-xs opacity-60">[[</span>
        {name}
        <span className="text-xs opacity-60">]]</span>
    </button>
);

// 懒加载 Markdown 预览组件
const MarkdownPreview = memo(({ content, existingNotes = [], onWikiLinkClick }) => {
    const [ReactMarkdown, setReactMarkdown] = useState(null);
    const [remarkGfm, setRemarkGfm] = useState(null);
    const [remarkMath, setRemarkMath] = useState(null);
    const [rehypeKatex, setRehypeKatex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            import('react-markdown'),
            import('remark-gfm'),
            import('remark-math'),
            import('rehype-katex')
        ]).then(([md, gfm, math, katex]) => {
            setReactMarkdown(() => md.default);
            setRemarkGfm(() => gfm.default);
            setRemarkMath(() => math.default);
            setRehypeKatex(() => katex.default);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // 处理双链点击
    const handleWikiLinkClick = useCallback((name) => {
        if (onWikiLinkClick) {
            onWikiLinkClick(name);
        }
    }, [onWikiLinkClick]);

    // 检查笔记是否存在
    const noteExists = useCallback((name) => {
        return existingNotes.some(note => 
            note.title?.toLowerCase() === name.toLowerCase()
        );
    }, [existingNotes]);

    // 处理内容中的双链
    const processedContent = useMemo(() => {
        if (!content) return '';
        // 将 [[笔记名]] 转换为特殊标记，稍后在渲染时替换
        return content.replace(/\[\[([^\]]+)\]\]/g, '`[[WIKILINK:$1]]`');
    }, [content]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <div className="animate-pulse">加载预览组件...</div>
            </div>
        );
    }

    if (!ReactMarkdown) {
        return <p className="text-slate-400">预览组件加载失败</p>;
    }

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm">预览区域</p>
                <p className="text-xs mt-1">在左侧编辑器中输入 Markdown 内容</p>
                <div className="mt-4 text-xs space-y-1 text-slate-300">
                    <p>支持的语法:</p>
                    <p>• <code className="bg-slate-100 px-1 rounded">$公式$</code> 行内数学公式</p>
                    <p>• <code className="bg-slate-100 px-1 rounded">$$公式$$</code> 块级数学公式</p>
                    <p>• <code className="bg-slate-100 px-1 rounded">[[笔记名]]</code> 双链引用</p>
                </div>
            </div>
        );
    }

    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                // 自定义标题样式
                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold text-slate-700 mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-700 mb-2 mt-4">{children}</h3>,
                // 代码块样式 - 处理双链
                code: ({ inline, className, children, ...props }) => {
                    const text = String(children).replace(/\n$/, '');
                    
                    // 检查是否是双链标记
                    if (inline && text.startsWith('[[WIKILINK:') && text.endsWith(']]')) {
                        const noteName = text.slice(11, -2);
                        return (
                            <WikiLink 
                                name={noteName} 
                                exists={noteExists(noteName)} 
                                onClick={handleWikiLinkClick} 
                            />
                        );
                    }
                    
                    if (inline) {
                        return <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded text-sm font-mono" {...props}>{children}</code>;
                    }
                    return (
                        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4">
                            <code className={`${className} text-sm font-mono`} {...props}>{children}</code>
                        </pre>
                    );
                },
                // 链接样式
                a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline">
                        {children}
                    </a>
                ),
                // 列表样式
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                // 引用样式
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-4 text-slate-600 italic bg-indigo-50/50 rounded-r">
                        {children}
                    </blockquote>
                ),
                // 表格样式
                table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">{children}</table>
                    </div>
                ),
                th: ({ children }) => <th className="px-4 py-2 bg-slate-100 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">{children}</td>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
