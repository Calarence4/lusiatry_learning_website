import React, { memo, useState, useCallback } from 'react';
import {
    Bold, Italic, Strikethrough, Code, Link, Image,
    List, ListOrdered, CheckSquare, Quote, Minus,
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Table, FileCode, Eye, Code2
} from 'lucide-react';

// 工具栏按钮组件
const ToolbarButton = memo(({ icon: Icon, title, onClick, isActive, disabled, isWarning }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-colors ${isWarning
            ? 'text-red-500 animate-shake'
            : isActive
                ? 'bg-indigo-100 text-indigo-600'
                : disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
            }`}
    >
        <Icon size={16} />
    </button>
));

// 工具栏分隔符
const ToolbarDivider = memo(() => <div className="w-px h-5 bg-slate-200 mx-1" />);

// 下拉菜单按钮
const DropdownButton = memo(({ icon: Icon, title, items, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    // 点击外部关闭
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                title={title}
                className={`p-1.5 rounded-md transition-colors ${isOpen
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                    }`}
            >
                <Icon size={16} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onSelect(item.value);
                                setIsOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                            {item.icon && <item.icon size={14} />}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

// 编辑工具条组件
const EditorToolbar = memo(({
    editMode,
    onEditModeChange,
    onInsert,
    getSelection, // 新增：获取当前选中文本的方法
    className = ''
}) => {
    // 警告状态，记录哪个按钮正在显示警告
    const [warningIndex, setWarningIndex] = useState(null);

    // 清除警告状态
    const clearWarning = useCallback(() => {
        setWarningIndex(null);
    }, []);

    // 处理需要选中文字的工具点击（支持toggle取消格式）
    const handleWrapInsert = useCallback((index, prefix, suffix, placeholder) => {
        // 检查是否有选中的文字
        const selection = getSelection?.();
        if (!selection || selection.length === 0) {
            // 没有选中文字，显示警告动画
            setWarningIndex(index);
            setTimeout(clearWarning, 500); // 500ms后清除警告
            return;
        }
        // 有选中文字，执行插入（启用toggle模式）
        onInsert?.(prefix, suffix, placeholder, true);
    }, [getSelection, onInsert, clearWarning]);

    // 标题下拉菜单项
    const headingItems = [
        { label: '一级标题', value: 'h1', icon: Heading1 },
        { label: '二级标题', value: 'h2', icon: Heading2 },
        { label: '三级标题', value: 'h3', icon: Heading3 },
        { label: '四级标题', value: 'h4', icon: Heading4 },
        { label: '五级标题', value: 'h5', icon: Heading5 },
        { label: '六级标题', value: 'h6', icon: Heading6 },
    ];

    // 处理标题插入
    const handleHeadingSelect = (value) => {
        const levels = { h1: '# ', h2: '## ', h3: '### ', h4: '#### ', h5: '##### ', h6: '###### ' };
        onInsert?.(levels[value], '', '标题');
    };

    // 列表下拉菜单项
    const listItems = [
        { label: '无序列表', value: 'ul', icon: List },
        { label: '有序列表', value: 'ol', icon: ListOrdered },
        { label: '任务列表', value: 'task', icon: CheckSquare },
    ];

    // 处理列表插入
    const handleListSelect = (value) => {
        const formats = {
            ul: ['- ', '', '列表项'],
            ol: ['1. ', '', '列表项'],
            task: ['- [ ] ', '', '任务项']
        };
        const [prefix, suffix, placeholder] = formats[value];
        onInsert?.(prefix, suffix, placeholder);
    };

    // 工具栏配置
    const toolbarGroups = [
        // 标题
        {
            type: 'dropdown',
            icon: Heading1,
            title: '标题',
            items: headingItems,
            onSelect: handleHeadingSelect
        },
        'divider',
        // 文本格式（需要选中文字）
        { icon: Bold, title: '粗体 (Ctrl+B)', needsSelection: true, prefix: '**', suffix: '**', placeholder: '粗体文字' },
        { icon: Italic, title: '斜体 (Ctrl+I)', needsSelection: true, prefix: '*', suffix: '*', placeholder: '斜体文字' },
        { icon: Strikethrough, title: '删除线', needsSelection: true, prefix: '~~', suffix: '~~', placeholder: '删除线文字' },
        'divider',
        // 代码（不需要选中文字）
        { icon: Code, title: '行内代码', onClick: () => onInsert?.('`', '`', 'code') },
        { icon: FileCode, title: '代码块', onClick: () => onInsert?.('```\n', '\n```', '// 代码') },
        'divider',
        // LaTeX 公式
        { type: 'text', text: '$', title: 'LaTeX 行内公式', onClick: () => onInsert?.('$', '$', 'formula') },
        { type: 'text', text: '$$', title: 'LaTeX 行间公式', onClick: () => onInsert?.('$$\n', '\n$$', 'formula') },
        'divider',
        // 链接和图片（需要选中文字）
        { icon: Link, title: '链接', needsSelection: true, prefix: '[', suffix: '](url)', placeholder: '链接文字' },
        { icon: Image, title: '图片', needsSelection: true, prefix: '![', suffix: '](url)', placeholder: '图片描述' },
        'divider',
        // 列表（下拉菜单）
        {
            type: 'dropdown',
            icon: List,
            title: '列表',
            items: listItems,
            onSelect: handleListSelect
        },
        'divider',
        // 引用和分割线
        { icon: Quote, title: '引用', onClick: () => onInsert?.('> ', '', '引用内容') },
        { icon: Minus, title: '分割线', onClick: () => onInsert?.('\n---\n', '', '') },
        'divider',
        // 表格
        {
            icon: Table, title: '表格', onClick: () => onInsert?.(
                '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| ',
                ' |  |  |',
                '内容'
            )
        },
    ];

    return (
        <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50/80 ${className}`}>
            {/* 左侧工具按钮 */}
            <div className="flex items-center gap-0.5 flex-wrap">
                {toolbarGroups.map((item, index) => {
                    if (item === 'divider') {
                        return <ToolbarDivider key={index} />;
                    }
                    if (item.type === 'dropdown') {
                        return (
                            <DropdownButton
                                key={index}
                                icon={item.icon}
                                title={item.title}
                                items={item.items}
                                onSelect={item.onSelect}
                            />
                        );
                    }
                    // 文本类型按钮（如 $ 和 $$）
                    if (item.type === 'text') {
                        return (
                            <button
                                key={index}
                                onClick={item.onClick}
                                title={item.title}
                                className="px-1.5 py-1 rounded-md transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-mono font-semibold min-w-[28px]"
                            >
                                {item.text}
                            </button>
                        );
                    }
                    // 需要选中文字的工具
                    if (item.needsSelection) {
                        return (
                            <ToolbarButton
                                key={index}
                                icon={item.icon}
                                title={item.title}
                                onClick={() => handleWrapInsert(index, item.prefix, item.suffix, item.placeholder)}
                                isWarning={warningIndex === index}
                            />
                        );
                    }
                    return (
                        <ToolbarButton
                            key={index}
                            icon={item.icon}
                            title={item.title}
                            onClick={item.onClick}
                        />
                    );
                })}
            </div>

            {/* 右侧模式切换 */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200">
                <button
                    onClick={() => onEditModeChange?.('live')}
                    title="阅览模式 - 实时预览"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${editMode === 'live'
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <Eye size={14} />
                    <span>阅览</span>
                </button>
                <button
                    onClick={() => onEditModeChange?.('source')}
                    title="源代码模式 - 纯文本编辑"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${editMode === 'source'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <Code2 size={14} />
                    <span>源码</span>
                </button>
            </div>
        </div>
    );
});

EditorToolbar.displayName = 'EditorToolbar';

export default EditorToolbar;
