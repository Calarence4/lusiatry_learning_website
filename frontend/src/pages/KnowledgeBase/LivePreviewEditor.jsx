import React, { useEffect, useRef, useState, useCallback, memo, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, Decoration, keymap, ViewPlugin, WidgetType, placeholder } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import 'katex/dist/katex.min.css';

// 动态导入 KaTeX
let katex = null;

// KaTeX 渲染函数
const renderKaTeX = (formula, displayMode = false) => {
    if (!katex) return null;
    try {
        return katex.renderToString(formula, {
            throwOnError: false,
            displayMode: displayMode
        });
    } catch {
        return null;
    }
};

// 数学公式预览 Widget - 在公式后面显示渲染结果
class MathPreviewWidget extends WidgetType {
    constructor(html, isBlock = false) {
        super();
        this.html = html;
        this.isBlock = isBlock;
    }

    toDOM() {
        const wrapper = document.createElement(this.isBlock ? 'div' : 'span');
        wrapper.className = this.isBlock ? 'cm-math-preview-block' : 'cm-math-preview-inline';
        wrapper.innerHTML = this.html;
        return wrapper;
    }

    eq(other) {
        return this.html === other.html && this.isBlock === other.isBlock;
    }

    ignoreEvent() {
        return true;
    }
}

// 创建实时预览插件
const createLivePreviewPlugin = () => {
    return ViewPlugin.fromClass(class {
        decorations = Decoration.none;

        constructor(view) {
            this.decorations = this.buildDecorations(view);
        }

        update(update) {
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view) {
            const decorations = [];
            const doc = view.state.doc.toString();
            const cursorPos = view.state.selection.main.head;
            let match;

            // 处理块级数学公式 $$...$$ (支持多行) - 在公式结束后添加预览
            const blockMathRegex = /\$\$([\s\S]+?)\$\$/g;
            while ((match = blockMathRegex.exec(doc)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                const formula = match[1].trim();

                // 添加源码的样式标记
                decorations.push(
                    Decoration.mark({ class: 'cm-md-block-math' }).range(start, end)
                );

                // 在公式结束位置添加渲染预览 widget
                const rendered = renderKaTeX(formula, true);
                if (rendered) {
                    decorations.push(
                        Decoration.widget({
                            widget: new MathPreviewWidget(rendered, true),
                            side: 1 // 在文本后面
                        }).range(end)
                    );
                }
            }

            // 处理行内数学公式 $formula$ - 在公式后添加预览
            const inlineMathRegex = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;
            while ((match = inlineMathRegex.exec(doc)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                const formula = match[1];

                // 检查是否在块级公式内
                const isInBlockMath = doc.substring(0, start).split('$$').length % 2 === 0;
                if (isInBlockMath) continue;

                // 添加源码样式
                decorations.push(
                    Decoration.mark({ class: 'cm-md-math' }).range(start, end)
                );

                // 在公式后添加渲染预览
                const rendered = renderKaTeX(formula, false);
                if (rendered) {
                    decorations.push(
                        Decoration.widget({
                            widget: new MathPreviewWidget(rendered, false),
                            side: 1
                        }).range(end)
                    );
                }
            }

            // 处理粗体 **text**
            const boldRegex = /\*\*([^*]+)\*\*/g;
            while ((match = boldRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-bold' }).range(match.index, match.index + match[0].length)
                );
            }

            // 处理斜体 *text*
            const italicRegex = /(?<!\*)\*([^*\n]+)\*(?!\*)/g;
            while ((match = italicRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-italic' }).range(match.index, match.index + match[0].length)
                );
            }

            // 处理行内代码 `code`
            const codeRegex = /`([^`\n]+)`/g;
            while ((match = codeRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-code' }).range(match.index, match.index + match[0].length)
                );
            }

            // 处理双链 [[note]]
            const wikiRegex = /\[\[([^\]]+)\]\]/g;
            while ((match = wikiRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-wikilink' }).range(match.index, match.index + match[0].length)
                );
            }

            // 处理链接 [text](url)
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            while ((match = linkRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-link' }).range(match.index, match.index + match[0].length)
                );
            }

            // 处理标题
            const headingRegex = /^(#{1,6})\s+(.+)$/gm;
            while ((match = headingRegex.exec(doc)) !== null) {
                decorations.push(
                    Decoration.mark({ class: 'cm-md-heading' }).range(match.index, match.index + match[0].length)
                );
            }

            // 排序
            decorations.sort((a, b) => {
                const aFrom = a.from ?? a.value?.from ?? 0;
                const bFrom = b.from ?? b.value?.from ?? 0;
                return aFrom - bFrom;
            });

            try {
                return Decoration.set(decorations, true);
            } catch (e) {
                console.warn('Decoration error:', e);
                return Decoration.none;
            }
        }
    }, {
        decorations: v => v.decorations
    });
};

// 编辑器主题
const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        fontSize: '14px',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    '.cm-content': {
        padding: '16px 24px',
        lineHeight: '1.8',
        caretColor: '#4f46e5'
    },
    '.cm-line': {
        padding: '2px 0'
    },
    '.cm-cursor': {
        borderLeftColor: '#4f46e5',
        borderLeftWidth: '2px'
    },
    '.cm-selectionBackground': {
        backgroundColor: '#c7d2fe !important'
    },
    '&.cm-focused .cm-selectionBackground': {
        backgroundColor: '#a5b4fc !important'
    },
    '.cm-activeLine': {
        backgroundColor: 'rgba(99, 102, 241, 0.05)'
    },
    // Markdown 语法样式
    '.cm-md-bold': {
        fontWeight: 'bold',
        color: '#1e293b'
    },
    '.cm-md-italic': {
        fontStyle: 'italic',
        color: '#475569'
    },
    '.cm-md-code': {
        fontFamily: 'ui-monospace, monospace',
        backgroundColor: '#f1f5f9',
        color: '#4f46e5',
        padding: '1px 4px',
        borderRadius: '3px',
        fontSize: '0.9em'
    },
    '.cm-md-math': {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0',
        color: 'transparent',
        padding: '0',
        margin: '0',
        width: '0',
        height: '0',
        overflow: 'hidden',
        display: 'inline-block'
    },
    '.cm-md-block-math': {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '0',
        color: 'transparent',
        lineHeight: '0',
        display: 'block',
        height: '0',
        overflow: 'hidden'
    },
    '.cm-md-wikilink': {
        color: '#4f46e5',
        backgroundColor: '#eef2ff',
        padding: '1px 4px',
        borderRadius: '3px',
        fontWeight: '500'
    },
    '.cm-md-link': {
        color: '#2563eb',
        textDecoration: 'underline'
    },
    '.cm-md-heading': {
        fontWeight: 'bold',
        color: '#0f172a',
        fontSize: '1.1em'
    },
    // 数学公式预览样式
    '.cm-math-preview-block': {
        display: 'block',
        textAlign: 'center',
        padding: '12px 16px',
        margin: '4px 0',
        backgroundColor: '#fefce8',
        borderRadius: '8px',
        border: '1px solid #fef08a',
        overflow: 'auto'
    },
    '.cm-math-preview-inline': {
        display: 'inline',
        verticalAlign: 'baseline'
    },
    // placeholder 样式
    '.cm-placeholder': {
        color: '#94a3b8',
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: '1.8',
        whiteSpace: 'pre-wrap'
    },
    // 确保空编辑器的光标高度正常
    '.cm-line:first-child': {
        minHeight: '1.8em'
    }
});

// Live Preview 编辑器组件
const LivePreviewEditor = forwardRef(({
    content,
    onChange,
    onSave,
    editMode = 'live', // 'live' | 'source'
    className = ''
}, ref) => {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const [initialized, setInitialized] = useState(false);

    // 初始化 KaTeX
    useEffect(() => {
        import('katex').then(mod => {
            katex = mod.default;
        });
    }, []);

    // 提供插入文本的方法
    const insertText = useCallback((prefix, suffix = '', placeholder = '') => {
        if (!viewRef.current) return;

        const view = viewRef.current;
        const { from, to } = view.state.selection.main;
        const selectedText = view.state.sliceDoc(from, to);
        const textToInsert = selectedText || placeholder;

        view.dispatch({
            changes: {
                from,
                to,
                insert: prefix + textToInsert + suffix
            },
            selection: {
                anchor: from + prefix.length,
                head: from + prefix.length + textToInsert.length
            }
        });

        view.focus();
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
        insertText
    }), [insertText]);

    // 创建编辑器
    useEffect(() => {
        if (!editorRef.current || viewRef.current) return;

        const extensions = [
            history(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                {
                    key: 'Mod-s',
                    run: () => {
                        onSave?.();
                        return true;
                    }
                }
            ]),
            markdown({ codeLanguages: languages }),
            syntaxHighlighting(defaultHighlightStyle),
            EditorView.lineWrapping,
            editorTheme,
            placeholder('使用 Markdown 语法书写笔记...'),
            EditorView.updateListener.of(update => {
                if (update.docChanged) {
                    const newContent = update.state.doc.toString();
                    onChange?.(newContent);
                }
            })
        ];

        // 只在 live 模式下添加实时预览插件
        if (editMode === 'live') {
            extensions.push(createLivePreviewPlugin());
        }

        const state = EditorState.create({
            doc: content || '',
            extensions
        });

        const view = new EditorView({
            state,
            parent: editorRef.current
        });

        viewRef.current = view;
        setInitialized(true);

        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [editMode]); // 当 editMode 改变时重建编辑器

    // 同步外部内容变化
    useEffect(() => {
        if (!viewRef.current || !initialized) return;

        const currentContent = viewRef.current.state.doc.toString();
        if (content !== currentContent) {
            viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: currentContent.length,
                    insert: content || ''
                }
            });
        }
    }, [content, initialized]);

    return (
        <div
            ref={editorRef}
            className={`h-full overflow-auto ${className}`}
            data-edit-mode={editMode}
        />
    );
});

LivePreviewEditor.displayName = 'LivePreviewEditor';

export default LivePreviewEditor;
