import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, BookOpen, Trash2, ChevronUp, ChevronDown, Edit3, Check, X, GraduationCap, Target, Layers, ExternalLink, FileText, Clock, History, Folder, Palette } from 'lucide-react';
import { coursesApi, subjectsApi } from '../api';

// 预设颜色列表
const PRESET_COLORS = [
    { name: '默认', value: null, bg: 'bg-white/60', text: 'text-slate-800' },
    { name: '靛蓝', value: 'indigo', bg: 'bg-indigo-50/80', text: 'text-indigo-900' },
    { name: '翠绿', value: 'emerald', bg: 'bg-emerald-50/80', text: 'text-emerald-900' },
    { name: '琥珀', value: 'amber', bg: 'bg-amber-50/80', text: 'text-amber-900' },
    { name: '玫红', value: 'rose', bg: 'bg-rose-50/80', text: 'text-rose-900' },
    { name: '天蓝', value: 'sky', bg: 'bg-sky-50/80', text: 'text-sky-900' },
    { name: '紫罗兰', value: 'violet', bg: 'bg-violet-50/80', text: 'text-violet-900' },
    { name: '青色', value: 'cyan', bg: 'bg-cyan-50/80', text: 'text-cyan-900' },
    { name: '橙色', value: 'orange', bg: 'bg-orange-50/80', text: 'text-orange-900' },
];

// 获取颜色样式
const getColorStyles = (colorValue) => {
    const color = PRESET_COLORS.find(c => c.value === colorValue) || PRESET_COLORS[0];
    return color;
};

// 可编辑进度组件
const EditableProgress = ({ current, total, onSave, isCompleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(current);
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(current);
    }, [current]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.max(0, Math.min(numValue, total));
        onSave(clampedValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setValue(current);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    ref={inputRef}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-12 text-center text-xs font-bold bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none focus:border-indigo-500"
                    min={0}
                    max={total}
                />
                <span className="text-xs text-slate-500">/ {total}</span>
            </div>
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className={`text-xs font-bold min-w-[3rem] text-right cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}
            title="点击编辑进度"
        >
            {current}/{total}
        </span>
    );
};

// 编辑课程模态框
const EditCourseModal = ({ course, subjects, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: course.title || '',
        subject: course.subject || '',
        total_lessons: course.total_lessons || 0,
        finished_lessons: course.finished_lessons || 0,
        course_url: course.course_url || '',
        notes_path: course.notes_path || '',
        start_date: course.start_date ? course.start_date.split('T')[0] : '',
        end_date: course.end_date ? course.end_date.split('T')[0] : '',
        color: course.color || null,
    });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const colorPickerRef = useRef(null);
    const subjectDropdownRef = useRef(null);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
                setShowColorPicker(false);
            }
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
                setShowSubjectDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!formData.title) {
            alert('请填写课程名称');
            return;
        }
        onSave(course.id, formData);
    };

    const currentColorStyle = getColorStyles(formData.color);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">编辑课程</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 表单内容 */}
                <div className="p-4 space-y-4">
                    {/* 课程名称 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">课程名称 *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                            placeholder="输入课程名称"
                        />
                    </div>

                    {/* 学科选择 */}
                    <div className="relative" ref={subjectDropdownRef}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">学科</label>
                        <div
                            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-indigo-300 transition-colors flex items-center justify-between"
                        >
                            <span className={formData.subject ? 'text-slate-800' : 'text-slate-400'}>
                                {formData.subject || '选择学科'}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showSubjectDropdown && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto">
                                    <div
                                        onClick={() => {
                                            setFormData({ ...formData, subject: '' });
                                            setShowSubjectDropdown(false);
                                        }}
                                        className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 cursor-pointer"
                                    >
                                        无学科
                                    </div>
                                    {subjects.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setFormData({ ...formData, subject: item.path || item.title });
                                                setShowSubjectDropdown(false);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 cursor-pointer"
                                        >
                                            <Folder size={14} className="text-slate-400" />
                                            <span>{item.path || item.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 进度设置 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">已完成课时</label>
                            <input
                                type="number"
                                value={formData.finished_lessons}
                                onChange={(e) => setFormData({ ...formData, finished_lessons: parseInt(e.target.value) || 0 })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                min={0}
                                max={formData.total_lessons}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">总课时</label>
                            <input
                                type="number"
                                value={formData.total_lessons}
                                onChange={(e) => setFormData({ ...formData, total_lessons: parseInt(e.target.value) || 0 })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                min={0}
                            />
                        </div>
                    </div>

                    {/* 卡片颜色 */}
                    <div className="relative" ref={colorPickerRef}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">卡片颜色</label>
                        <div
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-indigo-300 transition-colors flex items-center justify-between ${currentColorStyle.bg}`}
                        >
                            <div className="flex items-center gap-2">
                                <Palette size={14} className="text-slate-500" />
                                <span className={currentColorStyle.text}>{currentColorStyle.name}</span>
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showColorPicker ? 'rotate-180' : ''}`} />
                        </div>
                        {showColorPicker && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">
                                <div className="p-2 grid grid-cols-3 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <div
                                            key={color.name}
                                            onClick={() => {
                                                setFormData({ ...formData, color: color.value });
                                                setShowColorPicker(false);
                                            }}
                                            className={`px-3 py-2 rounded-lg text-sm cursor-pointer border-2 transition-all ${color.bg} ${color.text} ${formData.color === color.value ? 'border-indigo-500' : 'border-transparent hover:border-slate-300'}`}
                                        >
                                            {color.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 课程链接 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">课程链接</label>
                        <input
                            type="url"
                            value={formData.course_url}
                            onChange={(e) => setFormData({ ...formData, course_url: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                            placeholder="https://..."
                        />
                    </div>

                    {/* 笔记路径 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">笔记路径</label>
                        <input
                            type="text"
                            value={formData.notes_path}
                            onChange={(e) => setFormData({ ...formData, notes_path: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                            placeholder="知识库笔记路径"
                        />
                    </div>

                    {/* 日期 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex gap-3 p-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                        保存
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// 课程卡片组件
const CourseCard = ({ course, onIncrement, onDecrement, onDelete, onEdit }) => {
    const progress = course.total_lessons > 0
        ? Math.round((course.finished_lessons / course.total_lessons) * 100)
        : 0;
    const isCompleted = course.finished_lessons >= course.total_lessons;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`bg-white/60 backdrop-blur-md rounded-2xl border shadow-sm p-5 hover:bg-white/80 hover:shadow-md transition-all duration-200 group relative
                ${isCompleted ? 'border-emerald-200/60' : 'border-white/60'}`}
        >
            {/* 完成标记 */}
            {isCompleted && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} /> 已完成
                </div>
            )}

            {/* 课程标题和学科 */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-4">
                    <h3 className={`font-bold text-lg truncate ${isCompleted ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {course.title}
                    </h3>
                    {course.subject_name && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Layers size={12} />
                            <span>{course.subject_name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 主进度：课时 */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        <BookOpen size={14} className="text-accent" /> 课时进度
                    </span>
                    <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {course.finished_lessons} / {course.total_lessons}
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-accent'}`}
                    />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">{progress}%</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onDecrement(course.id)}
                            disabled={course.finished_lessons <= 0}
                            className="p-1 rounded-lg bg-white/60 border border-white/60 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronDown size={16} />
                        </button>
                        <button
                            onClick={() => onIncrement(course.id)}
                            disabled={course.finished_lessons >= course.total_lessons}
                            className="p-1 rounded-lg bg-white/60 border border-white/60 text-slate-500 hover:bg-accent hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronUp size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 自定义进度项 */}
            {course.custom_items && course.custom_items.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100/50">
                    {course.custom_items.map((item, idx) => {
                        const itemProgress = item.total > 0 ? Math.round((item.finished / item.total) * 100) : 0;
                        const itemCompleted = item.finished >= item.total;
                        return (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <Target size={10} /> {item.name}
                                    </span>
                                    <span className={`text-xs font-bold ${itemCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {item.finished} / {item.total}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${itemCompleted ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                                        style={{ width: `${itemProgress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(course)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-500 bg-white/50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <Edit3 size={12} /> 编辑
                </button>
                <button
                    onClick={() => onDelete(course.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-400 bg-white/50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={12} /> 删除
                </button>
            </div>
        </motion.div>
    );
};

export default function Course() {
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // 新课程表单
    const [newCourse, setNewCourse] = useState({
        title: '',
        subject: '',
        total_lessons: '',
        start_date: '',
        end_date: '',
        course_url: '',
        notes_path: '',
        custom_items: []
    });

    // 自定义项临时输入
    const [customItemInput, setCustomItemInput] = useState({ name: '', total: '' });

    // 学科选择下拉框状态
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const subjectDropdownRef = useRef(null);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
                setShowSubjectDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 加载数据
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [coursesData, subjectsData] = await Promise.all([
                    coursesApi.getAll(),
                    subjectsApi.getAll()
                ]);
                setCourses(coursesData || []);
                setSubjects(subjectsData || []);
            } catch (err) {
                console.error('加载数据失败:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 学科建议列表
    const subjectSuggestions = useMemo(() => {
        return subjects.map(s => ({ id: s.id, title: s.title, path: s.path || s.title }));
    }, [subjects]);

    // 选择学科
    const handleSelectSubject = (subjectItem) => {
        setNewCourse({ ...newCourse, subject: subjectItem.path || subjectItem.title });
        setSelectedSubjectId(subjectItem.id);
        setShowSubjectDropdown(false);
    };

    // 增加课时
    const handleIncrement = async (id) => {
        try {
            const result = await coursesApi.increment(id);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    };

    // 减少课时
    const handleDecrement = async (id) => {
        try {
            const course = courses.find(c => c.id === id);
            if (!course || course.finished_lessons <= 0) return;

            const result = await coursesApi.setProgress(id, course.finished_lessons - 1);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    };

    // 删除课程
    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这门课程吗？')) return;

        try {
            await coursesApi.delete(id);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('删除失败:', err);
            alert('删除失败: ' + err.message);
        }
    };

    // 添加自定义项到表单
    const addCustomItem = () => {
        if (!customItemInput.name || !customItemInput.total) return;

        setNewCourse(prev => ({
            ...prev,
            custom_items: [...prev.custom_items, {
                name: customItemInput.name,
                total: parseInt(customItemInput.total),
                finished: 0
            }]
        }));
        setCustomItemInput({ name: '', total: '' });
    };

    // 移除自定义项
    const removeCustomItem = (idx) => {
        setNewCourse(prev => ({
            ...prev,
            custom_items: prev.custom_items.filter((_, i) => i !== idx)
        }));
    };

    // 创建课程
    const handleCreateCourse = async () => {
        if (!newCourse.title || !newCourse.total_lessons) {
            return alert('请填写课程名称和总课时');
        }

        try {
            // 查找学科 ID
            const subjectItem = subjects.find(s => s.title === newCourse.subject);

            const courseData = {
                title: newCourse.title,
                subject: selectedSubjectId || null,
                total_lessons: parseInt(newCourse.total_lessons),
                start_date: newCourse.start_date || null,
                end_date: newCourse.end_date || null,
                course_url: newCourse.course_url || null,
                notes_path: newCourse.notes_path || null,
                custom_items: newCourse.custom_items
            };

            await coursesApi.create(courseData);

            // 刷新列表
            const updatedCourses = await coursesApi.getAll();
            setCourses(updatedCourses || []);

            // 重置表单
            setNewCourse({
                title: '',
                subject: '',
                total_lessons: '',
                start_date: '',
                end_date: '',
                course_url: '',
                notes_path: '',
                custom_items: []
            });
            setSelectedSubjectId(null);

            alert('课程创建成功');
        } catch (err) {
            console.error('创建失败:', err);
            alert('创建失败: ' + err.message);
        }
    };

    // 编辑课程
    const handleEdit = (course) => {
        setEditingCourse(course);
        setShowEditModal(true);
    };

    // 保存编辑
    const handleSaveEdit = async (id, formData) => {
        try {
            await coursesApi.update(id, {
                title: formData.title,
                subject: formData.subject || null,
                total_lessons: formData.total_lessons,
                finished_lessons: formData.finished_lessons,
                course_url: formData.course_url || null,
                notes_path: formData.notes_path || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                color: formData.color || null,
            });

            // 刷新列表
            const updatedCourses = await coursesApi.getAll();
            setCourses(updatedCourses || []);

            setShowEditModal(false);
            setEditingCourse(null);
        } catch (err) {
            console.error('更新失败:', err);
            alert('更新失败: ' + err.message);
        }
    };

    // 设置进度
    const handleSetProgress = async (id, newProgress) => {
        try {
            const result = await coursesApi.setProgress(id, newProgress);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    };

    // 统计数据
    const stats = useMemo(() => {
        const total = courses.length;
        const completed = courses.filter(c => c.finished_lessons >= c.total_lessons).length;
        const inProgress = total - completed;
        const totalLessons = courses.reduce((sum, c) => sum + c.total_lessons, 0);
        const finishedLessons = courses.reduce((sum, c) => sum + c.finished_lessons, 0);
        return { total, completed, inProgress, totalLessons, finishedLessons };
    }, [courses]);

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
                                placeholder="总课时 *"
                                value={newCourse.total_lessons}
                                onChange={e => setNewCourse({ ...newCourse, total_lessons: e.target.value })}
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
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                        <div className="h-5 w-1 rounded-full bg-accent"></div>
                        <h3 className="font-bold text-slate-700">我的课程 ({courses.length})</h3>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm flex-1 min-h-[500px] flex flex-col overflow-hidden">
                        {courses.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <GraduationCap size={40} className="text-slate-300 mb-3" />
                                <h3 className="text-base font-bold text-slate-500 mb-1">还没有课程</h3>
                                <p className="text-sm text-slate-400">在左侧添加课程</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {courses.map((course, index) => {
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
                                            ${index !== courses.length - 1 ? 'border-b border-slate-200/50' : ''}`}
                                        >
                                            {/* 第一行：课程名称 + 完成标记 + 操作按钮 */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <h4 className={`font-bold text-base truncate ${isCompleted ? 'text-emerald-700' : colorStyle.text}`}>
                                                        {course.title}
                                                    </h4>
                                                    {isCompleted && (
                                                        <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                                            <Check size={10} /> 已完成
                                                        </span>
                                                    )}
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

                                                {/* 如果没有自定义项，显示空白占位行保持布局一致 */}
                                                {customItems.length === 0 && (
                                                    <div className="h-6"></div>
                                                )}
                                                {customItems.length === 1 && (
                                                    <div className="h-6"></div>
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
                        onClose={() => {
                            setShowEditModal(false);
                            setEditingCourse(null);
                        }}
                        onSave={handleSaveEdit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
