import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, differenceInMinutes, set } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import LearningRecorder from '../components/LearningRecorder';
import { BookOpen, Globe, HelpCircle, CheckCircle2, Circle, CalendarRange, AlertTriangle, MoreHorizontal, Trophy, Zap, Sparkles } from 'lucide-react';
import { problemsApi, draftsApi, tasksApi } from '../api';



const NewsCard = () => (
    <div className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex-1 pr-6">
            <h3 className="text-xl font-bold text-slate-400 mb-3">每日资讯功能开发中... </h3>
            <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <span className="bg-white/60 px-2 py-1 rounded border border-white/50">敬请期待</span>
            </div>
        </div>
    </div>
);

const BlogPostCard = () => (
    <div className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/60">
        <h4 className="font-bold text-slate-400 text-xl mb-3">推荐阅读功能开发中... </h4>
        <p className="text-slate-400 text-sm">敬请期待</p>
    </div>
);

const TaskItemInner = ({ task, completed, onToggle, compact = false, isUrgent = false, isEmpty = false }) => {
    if (isEmpty) {
        return (
            <div className="flex flex-col justify-center items-center h-full w-full p-5 bg-white/20 border-dashed border border-white/40 rounded-xl">
                <span className="text-slate-400/60 text-xs font-bold tracking-wider">没有其他任务了</span>
            </div>
        );
    }

    const isDone = completed[task.id];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className={`flex flex-col justify-center h-full w-full cursor-pointer transition-colors duration-150 relative overflow-hidden
        ${compact ? 'px-4 py-1' : 'p-5'}
        ${isUrgent && !isDone ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-white/40 hover:bg-white/60'}
      `}
        >
            {isUrgent && !isDone && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}

            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold truncate ${compact ? 'text-xs' : 'text-sm'} ${isDone ? 'text-emerald-700 line-through opacity-60' : (isUrgent ? 'text-red-700 font-extrabold' : 'text-slate-700')}`}>
                            {task.name}
                        </span>
                        {task.ddl_time && !isDone && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1 
                 ${isUrgent ? 'bg-red-600 text-white animate-pulse' : 'text-red-500 bg-white/80 border border-white/60'}`}>
                                {isUrgent && <Zap size={8} className="fill-current" />}
                                {task.ddl_time.slice(0, 5)}
                            </span>
                        )}
                    </div>
                    {task.subject_name && !compact && (
                        <div className={`flex items-center gap-1 text-[10px] mt-1 ${isUrgent ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                            <CalendarRange size={10} /> <span>{task.subject_name}</span>
                        </div>
                    )}
                </div>
                {isDone ? <CheckCircle2 className="text-emerald-500 shrink-0" size={compact ? 16 : 20} /> : <Circle className={`${isUrgent ? 'text-red-500' : 'text-slate-400/80'} shrink-0`} size={compact ? 16 : 20} />}
            </div>
        </motion.div>
    );
};

export default function Home() {
    const navigate = useNavigate();
    const today = new Date();
    const [completed, setCompleted] = useState({});
    const [loading, setLoading] = useState(true);
    const [pendingQuestionsCount, setPendingQuestionsCount] = useState(0);
    const [recentQuestions, setRecentQuestions] = useState([]);
    const [pendingNotesCount, setPendingNotesCount] = useState(0);
    const [tasksData, setTasksData] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const todayStr = format(today, 'yyyy-MM-dd');

                const [problemsData, draftsData, todayTasks] = await Promise.all([
                    problemsApi.getAll({ status: '0' }),
                    draftsApi.getAll({ status: 'pending' }),
                    tasksApi.getByDate(todayStr)
                ]);

                setPendingQuestionsCount(problemsData?.length || 0);
                setRecentQuestions((problemsData || []).slice(0, 2));
                setPendingNotesCount(draftsData?.length || 0);
                setTasksData(todayTasks || []);
            } catch (err) {
                console.error('加载数据失败:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const visibleTasks = useMemo(() => {
        return tasksData.filter(t => !completed[t.id]);
    }, [completed, tasksData]);


    const warningState = useMemo(() => {
        const now = new Date();
        let lessThan1h = 0; let lessThan2h = 0;
        visibleTasks.forEach(task => {
            if (!task.ddl_time) return;
            const [hours, minutes] = task.ddl_time.split(':');
            const deadlineDate = set(now, { hours: parseInt(hours), minutes: parseInt(minutes), seconds: 0 });
            const diffMin = differenceInMinutes(deadlineDate, now);
            if (diffMin > 0 && diffMin < 60) lessThan1h++;
            if (diffMin > 0 && diffMin < 120) lessThan2h++;
        });
        const isGlobalWarning = (lessThan1h >= 2) || (lessThan1h >= 1 && lessThan2h >= 2);
        return {
            isGlobalWarning, lessThan1hIds: visibleTasks.filter(t => {
                if (!t.deadline) return false;
                const [h, m] = t.deadline.split(':');
                const d = set(now, { hours: parseInt(h), minutes: parseInt(m) });
                return differenceInMinutes(d, now) < 60 && differenceInMinutes(d, now) > 0;
            }).map(t => t.id)
        };
    }, [visibleTasks]);

    const isAllFinished = visibleTasks.length === 0;
    const toggleHomeTask = (id) => setCompleted(prev => ({ ...prev, [id]: true }));

    const renderTasks = () => {
        if (isAllFinished) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-60 bg-gradient-to-br from-yellow-50 to-amber-50/50 rounded-3xl border border-yellow-100/50 flex flex-col items-center justify-center p-6 text-center shadow-sm relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-yellow-200/10 animate-pulse rounded-3xl pointer-events-none"></div>
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="bg-white p-5 rounded-full mb-4 shadow-md relative z-10"
                    >
                        <Trophy size={48} className="text-yellow-500 drop-shadow-sm" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">今日任务全部完成！</h3>
                    <p className="text-slate-500 text-sm relative z-10 flex items-center gap-1">
                        休息一下，去补充点能量吧 <Sparkles size={14} className="text-yellow-500" />
                    </p>
                </motion.div>
            );
        }

        const BASE_SLOTS = 4;
        const slotsToRender = Math.max(BASE_SLOTS, Math.min(visibleTasks.length > 8 ? 3 : visibleTasks.length, BASE_SLOTS));
        const shouldOverflow = visibleTasks.length > 8;
        const gridBlocks = [];
        const loopCount = shouldOverflow ? 3 : 4;

        for (let i = 0; i < loopCount; i++) {
            const primaryTask = visibleTasks[i];
            const secondaryTask = visibleTasks[i + BASE_SLOTS];

            if (!primaryTask) {
                gridBlocks.push(
                    <div key={`empty-${i}`} className="h-full rounded-xl bg-white/10 border border-white/20 shadow-sm">
                        <TaskItemInner isEmpty={true} />
                    </div>
                );
                continue;
            }

            const isPrimaryUrgent = warningState.lessThan1hIds.includes(primaryTask.id);
            const isSecondaryUrgent = secondaryTask && warningState.lessThan1hIds.includes(secondaryTask.id);
            const hasUrgentInBlock = isPrimaryUrgent || isSecondaryUrgent;

            gridBlocks.push(
                <div key={`block-${primaryTask.id}`}
                    className={`h-full rounded-xl transition-all duration-200 flex flex-col overflow-hidden
            ${hasUrgentInBlock
                            ? 'bg-white/80 border border-red-300/50 shadow-sm scale-[1.01]'
                            : 'bg-white/60 border border-white/60 shadow-sm hover:bg-white/70'
                        }`}
                >
                    {secondaryTask ? (
                        <>
                            <div className={`flex-1 border-b ${hasUrgentInBlock ? 'border-red-200/50' : 'border-white/40'}`}>
                                <TaskItemInner task={primaryTask} completed={completed} onToggle={toggleHomeTask} compact={true} isUrgent={isPrimaryUrgent} />
                            </div>
                            <div className="flex-1">
                                <TaskItemInner task={secondaryTask} completed={completed} onToggle={toggleHomeTask} compact={true} isUrgent={isSecondaryUrgent} />
                            </div>
                        </>
                    ) : (
                        <TaskItemInner task={primaryTask} completed={completed} onToggle={toggleHomeTask} isUrgent={isPrimaryUrgent} />
                    )}
                </div>
            );
        }

        if (shouldOverflow) {
            gridBlocks.push(
                <div key="overflow-block" onClick={() => navigate('/checkin')} className="h-full bg-white/40 rounded-xl border border-dashed border-white/60 flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 transition-all group">
                    <MoreHorizontal size={32} className="text-slate-400 group-hover:text-slate-600 mb-1" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">还有 {visibleTasks.length - 6} 个任务</span>
                </div>
            );
        }
        return <AnimatePresence mode="popLayout">{gridBlocks}</AnimatePresence>;
    };

    if (loading) {
        return (
            <div className="relative w-full text-slate-800">
                <div className="fixed inset-0 z-0 bg-slate-50/40"></div>
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-12 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-64 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full text-slate-800">
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 space-y-12 pb-32">

                {/* 问候语区域 */}
                <div className="flex flex-col justify-start items-start">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-bold text-slate-800 drop-shadow-sm">早安, <span className="text-accent">Learner</span></h1>
                        {warningState.isGlobalWarning && (
                            <div className="flex items-center gap-1. 5 px-3 py-1 rounded-full bg-red-500 text-white shadow-md">
                                <AlertTriangle size={14} className="animate-pulse" />
                                <span className="text-xs font-bold tracking-wide">紧急状态</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-600 text-lg font-medium">{warningState.isGlobalWarning ? '检测到多个任务即将截止，请优先处理。' : '今天也是充满求知欲的一天。'}</p>
                </div>

                {/* 主内容区: 左右两栏 */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* 左侧容器 */}
                    <div className="lg:col-span-8 flex flex-col justify-between h-full space-y-6">

                        {/* 今日待办区域 */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`h-5 w-1 rounded-full transition-all duration-500 ${warningState.isGlobalWarning ? 'bg-red-500 shadow-sm animate-pulse' : 'bg-accent'}`}></div>
                                <h3 className="font-bold text-slate-700">今日待办 ({visibleTasks.length})</h3>
                            </div>

                            {isAllFinished ? (
                                <div className="w-full">
                                    {renderTasks()}
                                </div>
                            ) : (
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-[7rem] p-3 rounded-3xl transition-all duration-500 relative
                                    ${warningState.isGlobalWarning ? 'bg-red-500/5 ring-1 ring-red-500/10' : 'bg-white/10'}`}>
                                    {renderTasks()}
                                </div>
                            )}
                        </div>

                        {/* 统计卡片区域 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-all duration-200">
                                <div className="text-sm text-slate-500 mb-1 font-medium">今日专注</div>
                                <div className="text-2xl font-bold text-slate-800">-- h -- m</div>
                            </div>
                            <div className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-all duration-200">
                                <div className="text-sm text-slate-500 mb-1 font-medium">知识库新增</div>
                                <div className="text-2xl font-bold text-slate-800">-- <span className="text-xs font-normal text-slate-500">篇</span></div>
                            </div>
                            <div className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm hover:bg-white/80 transition-all duration-200">
                                <div className="text-sm text-slate-500 mb-1 font-medium">待归档笔记</div>
                                <div className="text-2xl font-bold text-slate-800 text-orange-600">{pendingNotesCount} <span className="text-xs font-normal text-slate-500">篇</span></div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧容器 */}
                    <div className="lg:col-span-4 flex flex-col h-full space-y-6">
                        <div className="flex-1"></div>
                        {/* LearningRecorder */}
                        <LearningRecorder />

                        {/* 待解决问题 */}
                        <div className="bg-white/60 rounded-2xl p-5 border border-white/60 shadow-sm hover:bg-white/80 transition-all duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <HelpCircle className="text-red-500" size={18} /> 待解决问题
                                </h4>
                                <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-xs font-bold">{pendingQuestionsCount}</span>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 mb-4">
                                {recentQuestions.length > 0 ? (
                                    recentQuestions.map(q => (
                                        <li key={q.id} className="flex gap-2 items-start">
                                            <span className="text-red-400 mt-1 font-bold">? </span>
                                            <span className={`line-clamp-1 ${q.is_solved ? 'text-slate-400 line-through' : ''}`}>{q.problem}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-slate-400">暂无待解决问题</li>
                                )}
                            </ul>
                            <Link to="/questions" className="block w-full text-center py-2 text-xs font-bold text-slate-600 bg-white/50 rounded-lg hover:bg-white/80 transition-colors">进入问题板块解决</Link>
                        </div>
                    </div>
                </section>

                {/* 每日资讯 */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 drop-shadow-sm">
                            <Globe className="text-accent" /> 每日资讯
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <NewsCard />
                    </div>
                </section>

                {/* 推荐阅读 */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 drop-shadow-sm">
                            <BookOpen className="text-accent" /> 推荐阅读 & 笔记
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BlogPostCard />
                        <BlogPostCard />
                    </div>
                </section>

            </div>
        </div>
    );
}