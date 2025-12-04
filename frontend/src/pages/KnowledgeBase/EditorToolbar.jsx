import React, { memo } from 'react';
import {
    Bold, Italic, Strikethrough, Code, Link, Image,
    List, ListOrdered, CheckSquare, Quote, Minus,
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Table, FileCode, Eye, Code2
} from 'lucide-react';

// 工具栏按钮组件
const ToolbarButton = memo(({ icon: Icon, title, onClick, isActive, disabled }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-1.5 rounded-md transition-colors ${isActive
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
    className = ''
}) => {
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
        // 文本格式
        { icon: Bold, title: '粗体 (Ctrl+B)', onClick: () => onInsert?.('**', '**', '粗体文字') },
        { icon: Italic, title: '斜体 (Ctrl+I)', onClick: () => onInsert?.('*', '*', '斜体文字') },
        { icon: Strikethrough, title: '删除线', onClick: () => onInsert?.('~~', '~~', '删除线文字') },
        'divider',
        // 代码
        { icon: Code, title: '行内代码', onClick: () => onInsert?.('`', '`', 'code') },
        { icon: FileCode, title: '代码块', onClick: () => onInsert?.('```\n', '\n```', '// 代码') },
        'divider',
        // 链接和图片
        { icon: Link, title: '链接', onClick: () => onInsert?.('[', '](url)', '链接文字') },
        { icon: Image, title: '图片', onClick: () => onInsert?.('![', '](url)', '图片描述') },
        'divider',
        // 列表
        { icon: List, title: '无序列表', onClick: () => onInsert?.('- ', '', '列表项') },
        { icon: ListOrdered, title: '有序列表', onClick: () => onInsert?.('1. ', '', '列表项') },
        { icon: CheckSquare, title: '任务列表', onClick: () => onInsert?.('- [ ] ', '', '任务项') },
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
