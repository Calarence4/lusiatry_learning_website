import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, Award, Trophy as TrophyIcon, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_TASKS_DATA } from '../data/mockDb';
import { isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, format, addDays, isSameDay, getDay, differenceInCalendarDays } from 'date-fns';

// === 1. 定义大类映射关系 ===
const SUBJECT_MAPPING = {
    'React': '计算机',
    '算法': '计算机',
    '后端': '计算机',
    '架构': '计算机',
    '运维': '计算机',
    '测试': '计算机',
    '设计': '设计',
    '英语': '语言',
    '日语': '语言',
    '吉他': '音乐',
    '钢琴': '音乐'
};

// === 2. 定义大类的颜色 ===
const MAJOR_SUBJECT_COLORS = {
    '计算机': '#6366f1', // Indigo
    '设计': '#f59e0b',   // Amber
    '语言': '#10b981',   // Emerald
    '音乐': '#f43f5e',   // Rose
    '其他': '#94a3b8'    // Slate
};

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-8} textAnchor="middle" fill="#334155" className="text-xl font-bold" style={{ fontSize: '20px' }}>
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#94a3b8" className="text-sm font-medium">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} className="filter drop-shadow-lg" />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={innerRadius - 6} outerRadius={innerRadius - 2} fill={fill} className="opacity-30" />
        </g>
    );
};

const LearningPieChart = ({ data, totalHours }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 h-full w-full">
            <div style={{ width: 256, height: 256 }} className="relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndex(index)}
                            stroke="none"
                            paddingAngle={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="outline-none transition-all duration-300" />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex-1 w-full space-y-4 min-w-0">
                <div className="flex justify-between items-baseline border-b border-slate-200/50 pb-3">
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Study Time</div>
                        <div className="text-3xl font-bold text-slate-700">{totalHours.toFixed(1)}<span className="text-base font-normal text-slate-400 ml-1">hours</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {data.map((item, index) => (
                        <div
                            key={item.name}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex items-center justify-between text-sm p-2.5 rounded-xl transition-all cursor-pointer border ${activeIndex === index
                                    ? 'bg-white shadow-sm border-slate-200 scale-[1.02]'
                                    : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-100'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className={`font-medium ${activeIndex === index ? 'text-slate-800' : 'text-slate-500'}`}>{item.name}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-xs font-bold">{item.value.toFixed(1)}h</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const getFirstMondayOfMonth = (date) => {
    const start = startOfMonth(date);
    const day = getDay(start);
    const diff = (day === 0 ? 1 : (8 - day) % 7);
    return addDays(start, diff);
};

export default function Dashboard() {
    const [timeRange, setTimeRange] = useState('week');

    const { pieData, trendData, totalHours, totalKnowledgePoints } = useMemo(() => {
        const now = new Date();
        let filterStart, filterEnd;

        if (timeRange === 'week') {
            filterStart = startOfWeek(now, { weekStartsOn: 1 });
            filterEnd = endOfWeek(now, { weekStartsOn: 1 });
        } else if (timeRange === 'month') {
            const firstMonday = getFirstMondayOfMonth(now);
            filterStart = firstMonday;
            // 修改：只覆盖4周 (28天)
            filterEnd = addDays(firstMonday, 28);
        } else {
            filterStart = startOfYear(now);
            filterEnd = endOfYear(now);
        }

        const filteredTasks = MOCK_TASKS_DATA.filter(task => {
            return isWithinInterval(parseISO(task.startDate), { start: filterStart, end: filterEnd });
        });

        const sumHours = filteredTasks.reduce((acc, cur) => acc + (cur.duration || 0), 0);
        const sumPoints = filteredTasks.filter(t => t.progress === 100).length;

        const categoryMap = {};
        filteredTasks.forEach(task => {
            const rawCat = task.category || '其他';
            const majorSubject = SUBJECT_MAPPING[rawCat] || '其他';
            if (!categoryMap[majorSubject]) categoryMap[majorSubject] = 0;
            categoryMap[majorSubject] += (task.duration || 0);
        });

        const calculatedPieData = Object.keys(categoryMap).map(cat => ({
            name: cat,
            value: categoryMap[cat],
            color: MAJOR_SUBJECT_COLORS[cat] || MAJOR_SUBJECT_COLORS['其他']
        })).sort((a, b) => b.value - a.value);

        if (calculatedPieData.length === 0) {
            calculatedPieData.push({ name: '无数据', value: 0.01, color: '#e2e8f0' });
        }

        let calculatedTrendData = [];
        const dataMap = {};

        if (timeRange === 'week') {
            const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            filteredTasks.forEach(task => {
                const day = format(parseISO(task.startDate), 'EEE');
                if (!dataMap[day]) dataMap[day] = 0;
                dataMap[day] += (task.duration || 0);
            });
            calculatedTrendData = weekOrder.map(day => ({ label: day, hours: dataMap[day] || 0 }));

        } else if (timeRange === 'month') {
            // 修改：只展示 Week 1 - Week 4
            const firstMonday = getFirstMondayOfMonth(now);
            const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

            filteredTasks.forEach(task => {
                const taskDate = parseISO(task.startDate);
                const diffDays = differenceInCalendarDays(taskDate, firstMonday);

                if (diffDays >= 0) {
                    const weekIndex = Math.floor(diffDays / 7);
                    if (weekIndex < 4) { // 只统计前4周
                        const key = `Week ${weekIndex + 1}`;
                        if (!dataMap[key]) dataMap[key] = 0;
                        dataMap[key] += (task.duration || 0);
                    }
                }
            });
            calculatedTrendData = weeks.map(w => ({ label: w, hours: dataMap[w] || 0 }));

        } else {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            filteredTasks.forEach(task => {
                const monthStr = format(parseISO(task.startDate), 'MMM');
                if (!dataMap[monthStr]) dataMap[monthStr] = 0;
                dataMap[monthStr] += (task.duration || 0);
            });
            calculatedTrendData = months.map(m => ({ label: m, hours: dataMap[m] || 0 }));
        }

        return {
            pieData: calculatedPieData,
            trendData: calculatedTrendData,
            totalHours: sumHours,
            totalKnowledgePoints: sumPoints
        };
    }, [timeRange]);

    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans">
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">学习仪表盘</h1>
                            <p className="text-slate-500 text-sm">可视化你的知识成长轨迹</p>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-sm flex gap-1">
                        {['week', 'month', 'year'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><BookOpen size={20} /></div>
                            <h2 className="text-xl font-bold text-slate-700">学科投入占比</h2>
                        </div>
                        <div className="flex-1 min-h-[300px] flex items-center justify-center w-full">
                            <LearningPieChart data={pieData} totalHours={totalHours} />
                        </div>
                    </motion.div>

                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} delay={0.1} className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Clock size={20} /></div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">统计中</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{totalHours.toFixed(1)}h</div>
                            <div className="text-sm text-slate-500">本{timeRange === 'week' ? '周' : timeRange === 'month' ? '月' : '年'}累计学习</div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} delay={0.2} className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Award size={20} /></div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800 mb-1">{totalKnowledgePoints}</div>
                            <div className="text-sm text-slate-500">已完成任务数</div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} delay={0.3} className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-lg font-bold mb-1">保持专注!</div>
                                <p className="text-indigo-100 text-sm mb-4">数据统计基于已录入的任务。</p>
                                <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors">去打卡</button>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                                <TrophyIcon size={120} />
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} delay={0.4}
                        className="lg:col-span-3 bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
                            <h2 className="text-xl font-bold text-slate-700">
                                学习时长趋势 ({timeRange === 'week' ? '每日' : timeRange === 'month' ? '每周' : '每月'})
                            </h2>
                        </div>
                        <div style={{ height: 256, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9', radius: 4 }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}