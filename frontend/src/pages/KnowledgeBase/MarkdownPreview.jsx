import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import 'katex/dist/katex.min.css';

// 双链组件 - 纯内联样式，只有颜色高亮
const WikiLink = ({ name, exists, onClick }) => (
    <span
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick(name);
        }}
        className={`cursor-pointer font-medium hover:underline
            ${exists ? 'text-indigo-600' : 'text-orange-500'}`}
        title={exists ? `跳转到: ${name}` : `笔记不存在，点击创建: ${name}`}
    >
        [[{name}]]
    </span>
);

// 处理文本中的双链，返回混合的文本和组件数组
const processTextWithWikiLinks = (text, noteExists, onWikiLinkClick) => {
    if (typeof text !== 'string') return text;

    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = wikiLinkRegex.exec(text)) !== null) {
        // 添加匹配前的普通文本
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // 添加双链组件
        const noteName = match[1];
        parts.push(
            <WikiLink
                key={key++}
                name={noteName}
                exists={noteExists(noteName)}
                onClick={onWikiLinkClick}
            />
        );
        lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

// 递归处理 children 中的双链
const processChildren = (children, noteExists, onWikiLinkClick) => {
    if (!children) return children;

    if (typeof children === 'string') {
        return processTextWithWikiLinks(children, noteExists, onWikiLinkClick);
    }

    if (Array.isArray(children)) {
        return children.map((child, index) => {
            if (typeof child === 'string') {
                const processed = processTextWithWikiLinks(child, noteExists, onWikiLinkClick);
                return Array.isArray(processed) ?
                    processed.map((p, i) => typeof p === 'string' ? p : React.cloneElement(p, { key: `${index}-${i}` })) :
                    processed;
            }
            if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                    key: index,
                    children: processChildren(child.props.children, noteExists, onWikiLinkClick)
                });
            }
            return child;
        }).flat();
    }

    if (React.isValidElement(children)) {
        return React.cloneElement(children, {
            children: processChildren(children.props.children, noteExists, onWikiLinkClick)
        });
    }

    return children;
};

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

    // 创建带双链处理的段落组件
    const createComponentWithWikiLinks = useCallback((Component, className) => {
        return ({ children, ...props }) => (
            <Component className={className} {...props}>
                {processChildren(children, noteExists, handleWikiLinkClick)}
            </Component>
        );
    }, [noteExists, handleWikiLinkClick]);

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
                // 段落 - 处理双链
                p: ({ children }) => (
                    <p className="my-2">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </p>
                ),
                // 自定义标题样式 - 处理双链
                h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-slate-700 mb-3 mt-6">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-slate-700 mb-2 mt-4">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </h3>
                ),
                // 列表项 - 处理双链
                li: ({ children }) => (
                    <li>{processChildren(children, noteExists, handleWikiLinkClick)}</li>
                ),
                // 代码块样式
                code: ({ inline, className, children, ...props }) => {
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
                // 引用样式 - 处理双链
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-4 text-slate-600 italic bg-indigo-50/50 rounded-r">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </blockquote>
                ),
                // 表格样式
                table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                        <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">{children}</table>
                    </div>
                ),
                th: ({ children }) => <th className="px-4 py-2 bg-slate-100 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">{children}</th>,
                td: ({ children }) => (
                    <td className="px-4 py-2 text-sm text-slate-600 border-b border-slate-100">
                        {processChildren(children, noteExists, handleWikiLinkClick)}
                    </td>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
});

MarkdownPreview.displayName = 'MarkdownPreview';

export default MarkdownPreview;
