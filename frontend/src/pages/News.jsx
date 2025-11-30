import React from 'react';
import { Globe, ArrowLeft, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function News() {
    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            {/* 背景 */}
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            {/* 头部导航 */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Globe className="text-accent" /> 每日资讯
                    </h1>
                </div>
            </div>

            {/* 主要内容 */}
            <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6">

                {/* 开发中提示卡片 */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-4">
                        <Globe size={32} className="text-accent" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">功能开发中</h2>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        每日资讯功能正在开发中，即将为你聚合全球前沿科技、学术动态、编程技术等精选内容。
                    </p>
                </div>

                {/* 占位资讯卡片 */}
                <div className="grid gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60">
                            <div className="flex gap-4">
                                {/* 左侧占位图标 */}
                                <div className="w-12 h-12 flex-shrink-0 bg-slate-100/80 rounded-xl flex items-center justify-center">
                                    <FileText size={20} className="text-slate-300" />
                                </div>

                                {/* 内容占位 */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-16 bg-slate-200/60 rounded"></div>
                                        <div className="h-4 w-20 bg-slate-100/60 rounded"></div>
                                    </div>
                                    <div className="h-5 w-3/4 bg-slate-200/80 rounded"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-slate-100/60 rounded"></div>
                                        <div className="h-3 w-5/6 bg-slate-100/60 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 底部提示 */}
                <div className="flex items-center justify-center gap-6 py-6">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Globe size={14} />
                        <span>RSS 订阅</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={14} />
                        <span>每日更新</span>
                    </div>
                </div>

            </div>
        </div>
    );
}