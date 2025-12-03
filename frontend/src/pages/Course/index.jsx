import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Plus, BookOpen, Trash2, ChevronUp, ChevronDown,
    Edit3, Check, X, GraduationCap, Target, ExternalLink,
    FileText, Clock, History, Folder, Play, Pause, CircleDot
} from 'lucide-react';

import { getColorStyles } from './constants';
import EditableProgress from './EditableProgress';
import EditCourseModal from './EditCourseModal';
import useCourseData from './useCourseData';

export default function Course() {
    const {
        // 状态
        courses,
        filteredCourses,
        loading,
        editingCourse,
        showEditModal,
        newCourse,
        customItemInput,
        showSubjectDropdown,
        subjectDropdownRef,
        subjectSuggestions,
        stats,
        statusFilter,
        courseLogs,
        expandedCourseId,

        // 设置函数
        setNewCourse,
        setCustomItemInput,
        setShowSubjectDropdown,
        setStatusFilter,

        // 处理函数
        handleSelectSubject,
        handleIncrement,
        handleDecrement,
        handleDelete,
        addCustomItem,
        removeCustomItem,
        handleCreateCourse,
        handleEdit,
        handleSaveEdit,
        handleSetProgress,
        closeEditModal,
        toggleCourseLogs,
    } = useCourseData();

    // 状态筛选选项
    const statusTabs = [
        { key: 'all', label: '全部', icon: BookOpen, count: stats.total },
        { key: 'in_progress', label: '进行中', icon: Play, count: stats.inProgress },
        { key: 'completed', label: '已完成', icon: Check, count: stats.completed },
        { key: 'not_started', label: '未开始', icon: CircleDot, count: stats.notStarted },
        { key: 'paused', label: '已暂停', icon: Pause, count: stats.paused },
    ];

    if (loading) {
        return (
            <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
                <div className="fixed inset-0 z-0 bg-slate-50/40"></div>
                <div className="relative z-10 flex items-center justify-center h-full">
                    <div className="animate-pulse space-y-4 w-full max-w-md">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-64 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen text-slate-800 font-sans p-6 flex flex-col">
            {/* 背景 */}
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-90" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop")' }}></div>
            <div className="fixed inset-0 z-0 bg-slate-50/40"></div>

            {/* 顶部导航 */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
                <Link to="/" className="p-2 rounded-xl bg-white/60 hover:bg-white/80 transition-colors shadow-sm text-slate-500 hover:text-slate-700 backdrop-blur-md border border-white/60">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">课程追踪</h1>
                    <p className="text-sm text-slate-500">管理你的课程进度</p>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-4">
                    <div className="text-sm text-slate-500 mb-1">总课程</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-4">
                    <div className="text-sm text-slate-500 mb-1">进行中</div>
                    <div className="text-2xl font-bold text-indigo-600">{stats.inProgress}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-4">
                    <div className="text-sm text-slate-500 mb-1">已完成</div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm p-4">
                    <div className="text-sm text-slate-500 mb-1">课时完成率</div>
                    <div className="text-2xl font-bold text-slate-800">
                        {stats.totalLessons > 0 ? Math.round((stats.finishedLessons / stats.totalLessons) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* 主内容区 */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-6 gap-6 flex-1">

                {/* 添加课程表单 - 左侧 */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                        <div className="h-5 w-1 rounded-full bg-slate-700"></div>
                        <h3 className="font-bold text-slate-700">添加课程</h3>
                    </div>

                    <div className="bg-slate-900/90 backdrop-blur-xl text-white rounded-2xl p-6 shadow-xl border border-slate-700/50 flex-1 min-h-[500px] flex flex-col">
                        <div className="space-y-3 flex-1">
                            {/* 课程名称 */}
                            <input
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                placeholder="课程名称 *"
                                value={newCourse.title}
                                onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                            />

                            {/* 学科选择 */}
                            <div className="relative" ref={subjectDropdownRef}>
                                <div
                                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white outline-none cursor-pointer hover:bg-slate-800 hover:border-indigo-500 transition-all flex items-center justify-between"
                                >
                                    <span className={newCourse.subject ? 'text-white truncate' : 'text-slate-400'}>
                                        {newCourse.subject ? newCourse.subject.split(' > ').pop() : '选择学科'}
                                    </span>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                                </div>

                                {showSubjectDropdown && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 shadow-xl border border-slate-700 rounded-xl overflow-hidden z-50">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 bg-slate-900/50 uppercase tracking-wider">
                                            选择学科
                                        </div>
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                            {subjectSuggestions.length === 0 ? (
                                                <div className="px-3 py-4 text-sm text-slate-400 text-center">
                                                    <p>暂无学科</p>
                                                    <p className="text-xs mt-1 text-slate-500">请先在知识库创建学科分类</p>
                                                </div>
                                            ) : (
                                                subjectSuggestions.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleSelectSubject(item)}
                                                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-indigo-600/30 hover:text-white cursor-pointer border-b border-slate-700/50 last:border-none transition-colors"
                                                    >
                                                        <Folder size={14} className="text-slate-500 shrink-0" />
                                                        <span className="truncate">{item.path || item.title}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 总课时 */}
                            <input
                                type="number"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                placeholder="总课时 * (至少1)"
                                value={newCourse.total_lessons}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || '';
                                    // 允许为空以便用户清除输入，但若有值则至少为1
                                    setNewCourse({ ...newCourse, total_lessons: val });
                                }}
                                min={1}
                            />

                            {/* 课程链接 */}
                            <input
                                type="url"
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                placeholder="课程链接 (选填)"
                                value={newCourse.course_url}
                                onChange={e => setNewCourse({ ...newCourse, course_url: e.target.value })}
                            />

                            {/* 笔记路径 */}
                            <input
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                placeholder="知识库笔记路径 (选填)"
                                value={newCourse.notes_path}
                                onChange={e => setNewCourse({ ...newCourse, notes_path: e.target.value })}
                            />

                            {/* 日期范围 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">开始日期</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                        value={newCourse.start_date}
                                        onChange={e => setNewCourse({ ...newCourse, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">结束日期</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-sm text-white outline-none focus:bg-slate-800 focus:border-indigo-500 transition-all"
                                        value={newCourse.end_date}
                                        onChange={e => setNewCourse({ ...newCourse, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* 自定义进度项 */}
                            <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-1">
                                    <Target size={12} /> 自定义追踪项
                                </div>

                                {/* 已添加的项 */}
                                {newCourse.custom_items.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {newCourse.custom_items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2">
                                                <span className="text-sm">{item.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">0 / {item.total}</span>
                                                    <button
                                                        onClick={() => removeCustomItem(idx)}
                                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 添加新项 */}
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                                        placeholder="项目名称 (如: 作业)"
                                        value={customItemInput.name}
                                        onChange={e => setCustomItemInput({ ...customItemInput, name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        className="w-16 bg-slate-900/50 border border-slate-600/50 rounded-lg p-2 text-xs text-white text-center outline-none focus:border-indigo-500"
                                        placeholder="总数"
                                        value={customItemInput.total}
                                        onChange={e => setCustomItemInput({ ...customItemInput, total: e.target.value })}
                                    />
                                    <button
                                        onClick={addCustomItem}
                                        className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 创建按钮 - 固定在底部 */}
                        <button
                            onClick={handleCreateCourse}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-bold text-sm mt-auto transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            创建课程
                        </button>
                    </div>
                </div>

                {/* 中间区域 - 学习历史时间线 */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                        <div className="h-5 w-1 rounded-full bg-amber-500"></div>
                        <h3 className="font-bold text-slate-700">学习动态</h3>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm flex-1 min-h-[500px] flex flex-col overflow-hidden p-5">
                        {courses.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <History size={40} className="text-slate-300 mb-3" />
                                <h3 className="text-base font-bold text-slate-500 mb-1">暂无学习记录</h3>
                                <p className="text-sm text-slate-400">开始学习后这里会显示你的动态</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="relative">
                                    {/* 时间线竖线 */}
                                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200/80"></div>

                                    {/* 时间线项目 */}
                                    <div className="space-y-4">
                                        {/* 根据课程数据生成时间线项 */}
                                        {courses.filter(c => c.finished_lessons > 0).slice(0, 8).map((course, idx) => {
                                            const isCompleted = course.finished_lessons >= course.total_lessons;
                                            return (
                                                <div key={course.id} className="flex gap-3 relative">
                                                    {/* 时间线节点 */}
                                                    <div className={`w-4 h-4 rounded-full shrink-0 z-10 flex items-center justify-center
                                                        ${isCompleted ? 'bg-emerald-500' : 'bg-accent'}`}>
                                                        {isCompleted ? (
                                                            <Check size={10} className="text-white" />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                        )}
                                                    </div>
                                                    {/* 内容 */}
                                                    <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/50 hover:bg-white/70 transition-colors">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                                {course.title}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {isCompleted ? '已完成' : `进行中 ${course.finished_lessons}/${course.total_lessons}`}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {isCompleted
                                                                ? `恭喜！已完成全部 ${course.total_lessons} 课时`
                                                                : `已学习 ${course.finished_lessons} 课时，还剩 ${course.total_lessons - course.finished_lessons} 课时`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* 如果没有已学习的课程 */}
                                        {courses.filter(c => c.finished_lessons > 0).length === 0 && (
                                            <div className="flex gap-3 relative">
                                                <div className="w-4 h-4 rounded-full shrink-0 z-10 bg-slate-300 flex items-center justify-center">
                                                    <Clock size={10} className="text-white" />
                                                </div>
                                                <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/50">
                                                    <span className="text-sm text-slate-400">开始你的第一课吧...</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 起始节点 */}
                                        <div className="flex gap-3 relative">
                                            <div className="w-4 h-4 rounded-full shrink-0 z-10 bg-slate-200 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                            </div>
                                            <div className="flex-1 py-1">
                                                <span className="text-xs text-slate-400">开始追踪课程</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 课程列表 - 右侧，占2/6 */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1 rounded-full bg-accent"></div>
                            <h3 className="font-bold text-slate-700">我的课程</h3>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm flex-1 min-h-[500px] flex flex-col overflow-hidden">
                        {/* 状态筛选标签 */}
                        <div className="flex items-center gap-1 p-3 border-b border-slate-200/50 overflow-x-auto shrink-0">
                            {statusTabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = statusFilter === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                                            ${isActive 
                                                ? 'bg-accent text-white shadow-sm' 
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={12} />
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                                ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {filteredCourses.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <GraduationCap size={40} className="text-slate-300 mb-3" />
                                <h3 className="text-base font-bold text-slate-500 mb-1">
                                    {statusFilter === 'all' ? '还没有课程' : '没有符合条件的课程'}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {statusFilter === 'all' ? '在左侧添加课程' : '切换筛选条件查看其他课程'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {filteredCourses.map((course, index) => {
                                    const progress = course.total_lessons > 0
                                        ? Math.round((course.finished_lessons / course.total_lessons) * 100)
                                        : 0;
                                    const isCompleted = course.finished_lessons >= course.total_lessons;
                                    const customItems = course.custom_items || [];
                                    const colorStyle = getColorStyles(course.color);

                                    return (
                                        <div
                                            key={course.id}
                                            className={`p-4 group hover:brightness-95 transition-all duration-200 ${colorStyle.bg}
                                            ${index !== filteredCourses.length - 1 ? 'border-b border-slate-200/50' : ''}`}
                                        >
                                            {/* 第一行：课程名称 + 状态标记 + 操作按钮 */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <h4 className={`font-bold text-base truncate ${isCompleted ? 'text-emerald-700' : colorStyle.text}`}>
                                                        {course.title}
                                                    </h4>
                                                    {/* 状态标签 */}
                                                    {isCompleted ? (
                                                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                                            <Check size={10} /> 已完成
                                                        </span>
                                                    ) : course.status === 'paused' ? (
                                                        <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                                            <Pause size={10} /> 已暂停
                                                        </span>
                                                    ) : course.finished_lessons > 0 ? (
                                                        <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                                            <Play size={10} /> 进行中
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(course)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                                                        title="编辑课程"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(course.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 第二行：课程链接 */}
                                            <div className="flex items-center gap-4 mb-2 text-xs">
                                                {course.course_url ? (
                                                    <a
                                                        href={course.course_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 hover:underline transition-colors"
                                                    >
                                                        <ExternalLink size={12} />
                                                        <span>课程链接</span>
                                                    </a>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-300">
                                                        <ExternalLink size={12} />
                                                        <span>无链接</span>
                                                    </span>
                                                )}
                                                {course.notes_path ? (
                                                    <Link
                                                        to={`/knowledge?path=${encodeURIComponent(course.notes_path)}`}
                                                        className="flex items-center gap-1 text-amber-500 hover:text-amber-600 hover:underline transition-colors"
                                                    >
                                                        <FileText size={12} />
                                                        <span>课程笔记</span>
                                                    </Link>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-300">
                                                        <FileText size={12} />
                                                        <span>无笔记</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* 第三行起：进度区域（预留三行） */}
                                            <div className="space-y-2">
                                                {/* 课时进度 - 始终显示 */}
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-500 w-12 shrink-0">{progress}%</span>
                                                    <div className="flex-1 h-3 bg-slate-200/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-accent'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <EditableProgress
                                                            current={course.finished_lessons}
                                                            total={course.total_lessons}
                                                            onSave={(newValue) => handleSetProgress(course.id, newValue)}
                                                            isCompleted={isCompleted}
                                                        />
                                                        <div className="flex items-center gap-0.5">
                                                            <button
                                                                onClick={() => handleDecrement(course.id)}
                                                                disabled={course.finished_lessons <= 0}
                                                                className="p-1 rounded bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                            >
                                                                <ChevronDown size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleIncrement(course.id)}
                                                                disabled={course.finished_lessons >= course.total_lessons}
                                                                className="px-2 py-1 rounded bg-accent/90 text-white text-xs font-bold hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                            >
                                                                +1
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 自定义进度项（最多显示2个，预留空间） */}
                                                {customItems.slice(0, 2).map((item, idx) => {
                                                    const itemProgress = item.total > 0 ? Math.round((item.finished / item.total) * 100) : 0;
                                                    const itemCompleted = item.finished >= item.total;
                                                    return (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-400 w-12 shrink-0 truncate" title={item.name}>{item.name}</span>
                                                            <div className="flex-1 h-2 bg-slate-200/50 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-300 ${itemCompleted ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                                                                    style={{ width: `${itemProgress}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-medium min-w-[3rem] text-right ${itemCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                                {item.finished}/{item.total}
                                                            </span>
                                                            {/* 占位，与上面按钮对齐 */}
                                                            <div className="w-[52px] shrink-0"></div>
                                                        </div>
                                                    );
                                                })}

                                                {/* 查看历史按钮 */}
                                                <button
                                                    onClick={() => toggleCourseLogs(course.id)}
                                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors mt-1"
                                                >
                                                    <History size={12} />
                                                    <span>{expandedCourseId === course.id ? '收起历史' : '查看进度历史'}</span>
                                                </button>

                                                {/* 进度历史日志 */}
                                                {expandedCourseId === course.id && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200/50">
                                                        {!courseLogs[course.id] ? (
                                                            <div className="text-xs text-slate-400 py-2">加载中...</div>
                                                        ) : courseLogs[course.id].length === 0 ? (
                                                            <div className="text-xs text-slate-400 py-2">暂无进度记录</div>
                                                        ) : (
                                                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                                                {courseLogs[course.id].map((log, idx) => (
                                                                    <div key={log.id || idx} className="flex items-center gap-2 text-xs">
                                                                        <span className="text-slate-400 w-20 shrink-0">
                                                                            {new Date(log.log_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                        <span className="text-slate-500">
                                                                            {log.prev_lessons} → {log.new_lessons}
                                                                        </span>
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                                                                            ${log.new_lessons > log.prev_lessons ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                            {log.new_lessons > log.prev_lessons ? `+${log.new_lessons - log.prev_lessons}` : log.new_lessons - log.prev_lessons}
                                                                        </span>
                                                                        {log.note && (
                                                                            <span className="text-slate-400 truncate flex-1" title={log.note}>
                                                                                {log.note}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 编辑课程模态框 */}
            <AnimatePresence>
                {showEditModal && editingCourse && (
                    <EditCourseModal
                        course={editingCourse}
                        subjects={subjectSuggestions}
                        onClose={closeEditModal}
                        onSave={handleSaveEdit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
