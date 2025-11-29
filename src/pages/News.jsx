import React from 'react';
import { Globe, ArrowUpRight, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NEWS_DATA = [
    {
        id: 1,
        title: "DeepMind 发布新一代 AI 气象预测模型 GraphCast",
        summary: "GraphCast 在 1 分钟内即可预测未来 10 天的全球天气，准确率超越传统 HRES 模型。这标志着 AI 在气象领域的重大突破...",
        date: "2023-11-27",
        category: "AI / Science",
        source: "Nature",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Nature_logo.svg/1200px-Nature_logo.svg.png"
    },
    {
        id: 2,
        title: "SpaceX 星舰第二次试飞任务详解与数据分析",
        summary: "虽然助推器在分离后爆炸，但飞船成功越过了卡门线。本次测试收集了大量热分离数据，为下一次迭代提供了宝贵参数。",
        date: "2023-11-26",
        category: "Aerospace",
        source: "BBC",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/BBC_Science_Focus_logo.svg/2560px-BBC_Science_Focus_logo.svg.png"
    },
    {
        id: 3,
        title: "TypeScript 5.4 Beta 发布：NoInfer 工具类型",
        summary: "微软发布 TS 5.4 Beta，引入了 NoInfer 类型以优化类型推断逻辑，同时修复了多个闭包相关的类型缩窄问题。",
        date: "2023-11-27",
        category: "Programming",
        source: "Microsoft",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png"
    }
];

export default function News() {
    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            {/* 1. 固定背景 */}
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            {/* 2. 头部导航 (新增) */}
            <div className="relative z-10 flex items-center gap-4 mb-2">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                {/* 移动端可能需要这个标题，但在大屏下原来的标题更突出，这里仅作为返回栏 */}
            </div>

            {/* 3. 主要内容容器 */}
            <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 页面标题区 */}
                <div className="flex items-end justify-between border-b border-slate-200/50 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 drop-shadow-sm">
                            <Globe className="text-accent" size={32} /> 全球前沿资讯
                        </h1>
                        <p className="text-slate-600 mt-2 font-medium">聚合权威媒体，追踪学科动态</p>
                    </div>
                    <div className="text-sm text-slate-500 bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm">今日已更新 12 条</div>
                </div>

                {/* 资讯列表 */}
                <div className="grid gap-6">
                    {NEWS_DATA.map(item => (
                        <div key={item.id} className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60 hover:shadow-lg hover:bg-white/80 transition-all group cursor-pointer">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* 左侧 Logo */}
                                <div className="w-16 h-16 flex-shrink-0 bg-white/50 rounded-xl border border-white/50 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <img src={item.logo} alt={item.source} className="w-full h-full object-contain mix-blend-multiply opacity-80" />
                                </div>

                                {/* 内容区 */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 bg-indigo-50/80 border border-indigo-100/50 text-accent text-xs font-bold rounded uppercase tracking-wide">{item.category}</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar size={12} /> {item.date}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-accent transition-colors">{item.title}</h2>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{item.summary}</p>
                                    <button className="text-sm font-semibold text-slate-500 hover:text-accent flex items-center gap-1 transition-colors">
                                        阅读原文 <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}