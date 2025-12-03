import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown, Folder, Palette, Play, Pause, Check, CircleDot } from 'lucide-react';
import { PRESET_COLORS, getColorStyles } from './constants';
import { useToast } from '../../components/Toast';

// 状态选项
const STATUS_OPTIONS = [
    { value: 'not_started', label: '未开始', icon: CircleDot, color: 'text-slate-500' },
    { value: 'in_progress', label: '进行中', icon: Play, color: 'text-indigo-600' },
    { value: 'completed', label: '已完成', icon: Check, color: 'text-emerald-600' },
    { value: 'paused', label: '已暂停', icon: Pause, color: 'text-amber-600' },
];

// 编辑课程模态框
const EditCourseModal = ({ course, subjects, onClose, onSave }) => {
    const toast = useToast();
    // 找到当前课程的学科信息
    const currentSubject = subjects.find(s => s.id === course.subject);
    
    const [formData, setFormData] = useState({
        title: course.title || '',
        subjectId: course.subject || null,  // 存储学科 ID
        subjectDisplay: currentSubject ? (currentSubject.path || currentSubject.title) : '',  // 存储显示名称
        total_lessons: course.total_lessons || 0,
        finished_lessons: course.finished_lessons || 0,
        course_url: course.course_url || '',
        notes_path: course.notes_path || '',
        start_date: course.start_date ? course.start_date.split('T')[0] : '',
        end_date: course.end_date ? course.end_date.split('T')[0] : '',
        color: course.color || null,
        status: course.status || 'not_started',  // 课程状态
    });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const colorPickerRef = useRef(null);
    const subjectDropdownRef = useRef(null);
    const statusDropdownRef = useRef(null);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
                setShowColorPicker(false);
            }
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
                setShowSubjectDropdown(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setShowStatusDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = () => {
        if (!formData.title) {
            toast.warning('请填写课程名称');
            return;
        }
        // 传递 subjectId 而不是 subject 字符串
        onSave(course.id, {
            ...formData,
            subject: formData.subjectId,  // 使用学科 ID
        });
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
                            <span className={formData.subjectDisplay ? 'text-slate-800' : 'text-slate-400'}>
                                {formData.subjectDisplay || '选择学科'}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showSubjectDropdown && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto">
                                    <div
                                        onClick={() => {
                                            setFormData({ ...formData, subjectId: null, subjectDisplay: '' });
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
                                                setFormData({ 
                                                    ...formData, 
                                                    subjectId: item.id,  // 存储 ID
                                                    subjectDisplay: item.path || item.title  // 存储显示名称
                                                });
                                                setShowSubjectDropdown(false);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer ${formData.subjectId === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'}`}
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
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    // 确保值在 0 到总课时之间
                                    const clampedVal = Math.max(0, Math.min(val, formData.total_lessons));
                                    setFormData({ ...formData, finished_lessons: clampedVal });
                                }}
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
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    // 总课时至少为 1
                                    const clampedVal = Math.max(1, val);
                                    setFormData({ ...formData, total_lessons: clampedVal });
                                }}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                min={1}
                            />
                        </div>
                    </div>

                    {/* 课程状态 */}
                    <div className="relative" ref={statusDropdownRef}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">课程状态</label>
                        <div
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-indigo-300 transition-colors flex items-center justify-between"
                        >
                            {(() => {
                                const currentStatus = STATUS_OPTIONS.find(s => s.value === formData.status) || STATUS_OPTIONS[0];
                                const Icon = currentStatus.icon;
                                return (
                                    <div className="flex items-center gap-2">
                                        <Icon size={14} className={currentStatus.color} />
                                        <span className={currentStatus.color}>{currentStatus.label}</span>
                                    </div>
                                );
                            })()}
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </div>
                        {showStatusDropdown && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white shadow-xl border border-slate-200 rounded-xl overflow-hidden z-50">
                                <div className="p-1">
                                    {STATUS_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <div
                                                key={option.value}
                                                onClick={() => {
                                                    setFormData({ ...formData, status: option.value });
                                                    setShowStatusDropdown(false);
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors
                                                    ${formData.status === option.value ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <Icon size={14} className={option.color} />
                                                <span className={option.color}>{option.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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

export default EditCourseModal;
