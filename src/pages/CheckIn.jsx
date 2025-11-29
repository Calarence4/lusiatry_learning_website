import React, { useState, useMemo, useEffect } from 'react';
// 1. 新增引入 endOfDay
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, isBefore, isToday, isFuture, startOfDay, endOfDay, addDays } from 'date-fns';
import { Plus, CheckCircle2, Circle, Ban, ChevronRight, Tag, Trash2, Clock, CalendarRange, List, XCircle, Calendar, Timer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_FILE_TREE, MOCK_TASKS_DATA } from '../data/mockDb';

// Logic: Only get top-level folders that are subjects
const getTopLevelSubjects = (nodes) => {
    return nodes
        .filter(node => node.type === 'folder' && node.isSubject)
        .map(node => node.title);
};

const MOCK_LOGS = { "1-2023-11-25": true, "1-2023-11-26": true };

export default function CheckIn() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState(MOCK_TASKS_DATA);
    const [completedLog, setCompletedLog] = useState(MOCK_LOGS);
    const [exceptionLog, setExceptionLog] = useState({});
    const [newTask, setNewTask] = useState({
        title: '', category: '', deadline: '', isRecurring: false, recurType: 'duration', durationDays: 7, startDate: '', endDate: ''
    });

    const topLevelSuggestions = useMemo(() => getTopLevelSubjects(MOCK_FILE_TREE), []);

    useEffect(() => {
        setNewTask(prev => ({ ...prev, startDate: format(selectedDate, 'yyyy-MM-dd'), endDate: format(selectedDate, 'yyyy-MM-dd') }));
    }, [selectedDate]);

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getTasksForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return tasks.filter(t => {
            // 2. 修复：强制使用 startOfDay 和 endOfDay 覆盖全天
            const inRange = isWithinInterval(day, {
                start: startOfDay(parseISO(t.startDate)),
                end: endOfDay(parseISO(t.endDate))
            });
            const isExcluded = exceptionLog[`${t.id}-${dayStr}`];
            return inRange && !isExcluded;
        });
    };

    const getDayStatusClass = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = getTasksForDay(day);

        if (dayTasks.length === 0) return isBefore(day, startOfDay(new Date())) ? 'bg-slate-50/50 text-slate-300 border-slate-100/50' : 'bg-white/40 text-slate-400 border-white/40';
        if (isToday(day) || isFuture(day)) return 'bg-indigo-50/80 text-indigo-600 border-indigo-200/80 shadow-sm';
        const isAllDone = dayTasks.every(t => completedLog[`${t.id}-${dayStr}`]);
        return isAllDone ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/80 shadow-sm' : 'bg-red-50/80 text-red-500 border-red-200/80 shadow-sm';
    };

    const isLocked = isBefore(selectedDate, startOfDay(new Date()));
    const activeTasks = getTasksForDay(selectedDate);

    const toggleTask = (taskId) => {
        if (isLocked) return;
        const key = `${taskId}-${format(selectedDate, 'yyyy-MM-dd')}`;
        setCompletedLog(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddTask = () => {
        if (!newTask.title || !newTask.category) return alert("请完善任务信息");
        let finalStart = newTask.startDate;
        let finalEnd = newTask.endDate;
        if (newTask.isRecurring) {
            if (newTask.recurType === 'duration') {
                if (!newTask.startDate) finalStart = format(selectedDate, 'yyyy-MM-dd');
                finalEnd = format(addDays(parseISO(finalStart), parseInt(newTask.durationDays || 0)), 'yyyy-MM-dd');
            }
        } else {
            finalStart = format(selectedDate, 'yyyy-MM-dd');
            finalEnd = format(selectedDate, 'yyyy-MM-dd');
        }
        setTasks([...tasks, {
            id: Date.now(),
            title: newTask.title,
            category: newTask.category,
            deadline: newTask.deadline,
            startDate: finalStart,
            endDate: finalEnd
        }]);
        setNewTask(prev => ({ ...prev, title: '', deadline: '', isRecurring: false }));
    };

    const removeTaskFromDay = (taskId) => {
        const key = `${taskId}-${format(selectedDate, 'yyyy-MM-dd')}`;
        setExceptionLog(prev => ({ ...prev, [key]: true }));
    };

    const deleteRecurringTask = (taskId) => {
        if (window.confirm("确定要永久删除这个打卡计划吗？")) {
            setTasks(tasks.filter(t => t.id !== taskId));
        }
    };

    const getTaskProgress = (task) => Math.floor(Math.random() * 100);

    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">打卡计划</h1>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">

                <div className="col-span-5 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-white/60 p-6 flex flex-col">
                    <div className="flex justify-between items-end mb-6"><h2 className="text-3xl font-bold text-slate-800">{format(selectedDate, 'yyyy.MM')}</h2><div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider"><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Done</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Miss</div><div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Plan</div></div></div>
                    <div className="grid grid-cols-7 gap-2 flex-1 content-start overflow-y-auto custom-scrollbar pr-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase mb-1">{d}</div>)}
                        {daysInMonth.map(day => {
                            const isSelected = isSameDay(day, selectedDate);
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const dayTasks = getTasksForDay(day);
                            return (
                                <div key={day.toString()} onClick={() => setSelectedDate(day)} className={`relative h-20 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${getDayStatusClass(day)} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-500 z-10 shadow-lg scale-[1.02]' : 'hover:border-indigo-200'}`}>
                                    <span className="text-lg font-bold">{format(day, 'd')}</span>
                                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">{dayTasks.slice(0, 4).map((t, i) => (<div key={i} className={`w-1 h-1 rounded-full ${completedLog[`${t.id}-${dayStr}`] ? 'bg-current opacity-40' : 'bg-current'}`}></div>))}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-4 flex flex-col gap-4 h-full">
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 border border-white/60 shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-4 shrink-0"><div><h3 className="text-xl font-bold text-slate-800">{format(selectedDate, 'MM.dd')}</h3><div className="text-xs font-bold text-slate-500 uppercase mt-1">{isLocked ? 'History' : 'Today\'s Tasks'}</div></div>{isLocked && <Ban className="text-slate-400" size={20} />}</div>
                        <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                            {activeTasks.length === 0 && <div className="text-slate-400 text-sm py-10 text-center flex flex-col items-center"><Calendar size={32} className="mb-2 opacity-40" />今日无安排</div>}
                            {activeTasks.map(task => {
                                const isDone = completedLog[`${task.id}-${format(selectedDate, 'yyyy-MM-dd')}`];
                                return (
                                    <div key={task.id} onClick={() => toggleTask(task.id)} className={`p-3 rounded-xl border group flex items-center justify-between relative transition-all ${isDone ? 'bg-emerald-50/60 border-emerald-100/60' : 'bg-white/40 border-white/40'} ${isLocked ? 'opacity-60' : 'cursor-pointer hover:bg-white/80 hover:shadow-sm'}`}>
                                        <div className="flex-1 min-w-0 mr-2">
                                            <span className={`font-bold text-sm block truncate ${isDone ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                            {task.deadline && <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5"><Timer size={10} /> {task.deadline} 截止</div>}
                                        </div>
                                        <div className="flex items-center gap-2">{isDone ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Circle className="text-slate-400" size={18} />}<button onClick={(e) => { e.stopPropagation(); removeTaskFromDay(task.id); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-all opacity-0 group-hover:opacity-100" title="仅从今日移除"><XCircle size={16} /></button></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-3xl p-5 shadow-xl shrink-0 z-20 border border-slate-700/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-3 uppercase"><Plus size={14} /> Add New Task</div>
                        <div className="space-y-2">
                            <input className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg p-2 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all" placeholder="任务名称" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input list="simple-checkin-subjects" className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg p-2 pl-8 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all" placeholder="大分类" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })} />
                                    <Tag size={12} className="absolute left-2.5 top-3 text-slate-500" /><datalist id="simple-checkin-subjects">{topLevelSuggestions.map((sub, i) => <option key={i} value={sub} />)}</datalist>
                                </div>
                                <div className="relative w-24">
                                    <input type="time" className="w-full bg-slate-800/50 border-slate-700/50 rounded-lg p-2 pl-7 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                                    <Timer size={12} className="absolute left-2.5 top-3 text-slate-500" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-1"><input type="checkbox" id="isRecur" className="rounded bg-slate-700 border-slate-600" checked={newTask.isRecurring} onChange={e => setNewTask({ ...newTask, isRecurring: e.target.checked })} /><label htmlFor="isRecur" className="text-xs text-slate-300 cursor-pointer">设为周期任务</label></div>
                            {newTask.isRecurring && (
                                <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 space-y-2 text-xs animate-in slide-in-from-top-1">
                                    <div className="flex bg-slate-900/50 rounded p-0.5"><button onClick={() => setNewTask({ ...newTask, recurType: 'duration' })} className={`flex-1 py-1 rounded transition-colors ${newTask.recurType === 'duration' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>按天数</button><button onClick={() => setNewTask({ ...newTask, recurType: 'range' })} className={`flex-1 py-1 rounded transition-colors ${newTask.recurType === 'range' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>按日期</button></div>
                                    {newTask.recurType === 'duration' ? <div className="flex items-center gap-2"><span>持续</span><input type="number" className="w-12 bg-slate-900/80 border-slate-600 rounded p-1 text-center outline-none" value={newTask.durationDays} onChange={e => setNewTask({ ...newTask, durationDays: e.target.value })} /><span>天</span></div> : <div className="grid grid-cols-2 gap-2"><input type="date" className="bg-slate-900/80 border-slate-600 rounded p-1 outline-none" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} /><input type="date" className="bg-slate-900/80 border-slate-600 rounded p-1 outline-none" value={newTask.endDate} onChange={e => setNewTask({ ...newTask, endDate: e.target.value })} /></div>}
                                </div>
                            )}
                            <button onClick={handleAddTask} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-lg font-bold text-xs mt-1 transition-colors shadow-lg shadow-indigo-500/20">创建任务</button>
                        </div>
                    </div>
                </div>

                <div className="col-span-3 bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-5 border-b border-white/40 bg-white/20"><div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide"><List size={18} className="text-accent" /> 周期计划</div><div className="text-xs text-slate-500 mt-1">管理所有长期打卡任务</div></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {tasks.map(task => {
                            const progress = getTaskProgress(task);
                            return (
                                <div key={task.id} className="bg-white/50 border border-white/50 rounded-xl p-4 hover:shadow-md hover:bg-white/80 hover:border-indigo-200 transition-all group relative">
                                    <div className="flex justify-between items-start mb-2"><div className="font-bold text-slate-700 line-clamp-1 mr-2" title={task.title}>{task.title}</div><div className="text-[10px] font-bold text-slate-500 bg-white/50 px-1.5 py-0.5 rounded border border-white/50">{task.category}</div></div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3"><CalendarRange size={12} /><span>{format(parseISO(task.startDate), 'MM.dd')} - {format(parseISO(task.endDate), 'MM.dd')}</span></div>
                                    {task.deadline && <div className="flex items-center gap-2 text-xs text-red-400 mb-3"><Timer size={12} /><span>每日 {task.deadline} 截止</span></div>}
                                    <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden mb-1"><div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }}></div></div>
                                    <div className="flex justify-between text-[10px] text-slate-400"><span>Progress</span><span>{progress}%</span></div>
                                    <button onClick={() => deleteRecurringTask(task.id)} className="absolute top-2 right-2 bg-white/80 border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all" title="永久删除该计划"><Trash2 size={14} /></button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}