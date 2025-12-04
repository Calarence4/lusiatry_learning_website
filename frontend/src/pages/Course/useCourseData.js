import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { coursesApi, subjectsApi } from '../../api';
import { useToast } from '../../components/Toast';

export default function useCourseData() {
    const toast = useToast();
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // 状态筛选
    const [statusFilter, setStatusFilter] = useState('in_progress'); // not_started, in_progress, completed, paused

    // 课程日志
    const [courseLogs, setCourseLogs] = useState({});  // { courseId: [logs] }
    const [expandedCourseId, setExpandedCourseId] = useState(null);  // 当前展开显示日志的课程
    const [recentActivity, setRecentActivity] = useState([]);  // 学习动态

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
                const [coursesData, subjectsData, activityData] = await Promise.all([
                    coursesApi.getAll(),
                    subjectsApi.getAll(),
                    coursesApi.getActivity(8)
                ]);
                setCourses(coursesData || []);
                setSubjects(subjectsData || []);
                setRecentActivity(activityData || []);
            } catch (err) {
                console.error('加载数据失败:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 刷新学习动态
    const refreshActivity = useCallback(async () => {
        try {
            const activityData = await coursesApi.getActivity(8);
            setRecentActivity(activityData || []);
        } catch (err) {
            console.error('刷新学习动态失败:', err);
        }
    }, []);

    // 学科建议列表
    const subjectSuggestions = useMemo(() => {
        return subjects.map(s => ({ id: s.id, title: s.title, path: s.path || s.title }));
    }, [subjects]);

    // 统计数据
    const stats = useMemo(() => {
        const total = courses.length;
        const completed = courses.filter(c => c.status === 'completed' || c.finished_lessons >= c.total_lessons).length;
        const inProgress = courses.filter(c => c.status === 'in_progress' || (c.finished_lessons > 0 && c.finished_lessons < c.total_lessons)).length;
        const notStarted = courses.filter(c => c.status === 'not_started' || c.finished_lessons === 0).length;
        const paused = courses.filter(c => c.status === 'paused').length;
        const totalLessons = courses.reduce((sum, c) => sum + c.total_lessons, 0);
        const finishedLessons = courses.reduce((sum, c) => sum + c.finished_lessons, 0);
        return { total, completed, inProgress, notStarted, paused, totalLessons, finishedLessons };
    }, [courses]);

    // 筛选后的课程列表
    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            // 兼容旧数据：如果没有status字段，根据进度判断
            const status = c.status || (
                c.finished_lessons === 0 ? 'not_started' :
                    c.finished_lessons >= c.total_lessons ? 'completed' : 'in_progress'
            );
            return status === statusFilter;
        });
    }, [courses, statusFilter]);

    // 获取课程日志
    const fetchCourseLogs = useCallback(async (courseId) => {
        try {
            const logs = await coursesApi.getLogs(courseId, 10);  // 最近10条
            setCourseLogs(prev => ({ ...prev, [courseId]: logs }));
        } catch (err) {
            console.error('获取日志失败:', err);
        }
    }, []);

    // 切换展开课程日志
    const toggleCourseLogs = useCallback((courseId) => {
        if (expandedCourseId === courseId) {
            setExpandedCourseId(null);
        } else {
            setExpandedCourseId(courseId);
            // 如果还没加载过该课程的日志，则加载
            if (!courseLogs[courseId]) {
                fetchCourseLogs(courseId);
            }
        }
    }, [expandedCourseId, courseLogs, fetchCourseLogs]);

    // 选择学科
    const handleSelectSubject = useCallback((subjectItem) => {
        setNewCourse(prev => ({ ...prev, subject: subjectItem.path || subjectItem.title }));
        setSelectedSubjectId(subjectItem.id);
        setShowSubjectDropdown(false);
    }, []);

    // 增加课时
    const handleIncrement = useCallback(async (id) => {
        try {
            const result = await coursesApi.increment(id);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons, status: result.status } : c
            ));
            // 刷新学习动态
            refreshActivity();
        } catch (err) {
            console.error('更新失败:', err);
            toast.error('操作失败: ' + err.message);
        }
    }, [toast, refreshActivity]);

    // 减少课时
    const handleDecrement = useCallback(async (id) => {
        const course = courses.find(c => c.id === id);
        if (!course || course.finished_lessons <= 0) return;

        try {
            const result = await coursesApi.setProgress(id, course.finished_lessons - 1);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons, status: result.status } : c
            ));
            // 刷新学习动态
            refreshActivity();
        } catch (err) {
            console.error('更新失败:', err);
            toast.error('操作失败: ' + err.message);
        }
    }, [courses, toast, refreshActivity]);

    // 删除课程
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('确定要删除这门课程吗？')) return;

        try {
            await coursesApi.delete(id);
            setCourses(prev => prev.filter(c => c.id !== id));
            toast.success('删除成功');
        } catch (err) {
            console.error('删除失败:', err);
            toast.error('删除失败: ' + err.message);
        }
    }, [toast]);

    // 添加自定义项到表单
    const addCustomItem = useCallback(() => {
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
    }, [customItemInput]);

    // 移除自定义项
    const removeCustomItem = useCallback((idx) => {
        setNewCourse(prev => ({
            ...prev,
            custom_items: prev.custom_items.filter((_, i) => i !== idx)
        }));
    }, []);

    // 创建课程
    const handleCreateCourse = useCallback(async () => {
        if (!newCourse.title) {
            return toast.warning('请填写课程名称');
        }

        const totalLessons = parseInt(newCourse.total_lessons);
        if (!totalLessons || totalLessons < 1) {
            return toast.warning('总课时必须至少为 1');
        }

        try {
            const courseData = {
                title: newCourse.title,
                subject: selectedSubjectId || null,
                total_lessons: totalLessons,
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

            toast.success('课程创建成功');
        } catch (err) {
            console.error('创建失败:', err);
            toast.error('创建失败: ' + err.message);
        }
    }, [newCourse, selectedSubjectId, toast]);

    // 编辑课程
    const handleEdit = useCallback((course) => {
        setEditingCourse(course);
        setShowEditModal(true);
    }, []);

    // 关闭编辑模态框
    const closeEditModal = useCallback(() => {
        setShowEditModal(false);
        setEditingCourse(null);
    }, []);

    // 保存编辑
    const handleSaveEdit = useCallback(async (id, formData) => {
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
            toast.success('更新成功');
        } catch (err) {
            console.error('更新失败:', err);
            toast.error('更新失败: ' + err.message);
        }
    }, [toast]);

    // 设置进度
    const handleSetProgress = useCallback(async (id, newProgress) => {
        try {
            const result = await coursesApi.setProgress(id, newProgress);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            toast.error('操作失败: ' + err.message);
        }
    }, [toast]);

    return {
        // 状态
        courses,
        filteredCourses,
        subjects,
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
        recentActivity,

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
        fetchCourseLogs,
        refreshActivity,
    };
}
