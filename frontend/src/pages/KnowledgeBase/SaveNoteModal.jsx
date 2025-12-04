import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

export default function SaveNoteModal({ open, onClose, onConfirm, defaultTitle = '' }) {
    const [title, setTitle] = useState(defaultTitle);
    const inputRef = useRef(null);

    // 打开时重置标题并聚焦
    useEffect(() => {
        if (open) {
            setTitle(defaultTitle);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, defaultTitle]);

    if (!open) return null;

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (title.trim()) {
            onConfirm(title.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 模态框 */}
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 w-full max-w-md mx-4 overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Save size={20} className="text-indigo-500" />
                        保存笔记
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 内容 */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-600">
                            笔记标题
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                            placeholder="请输入笔记标题..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* 底部按钮 */}
                    <div className="flex gap-3 justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <Save size={16} />
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
