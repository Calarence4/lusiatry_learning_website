import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { coursesApi, subjectsApi } from '../../api';

export default function useCourseData() {
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

    // 统计数据
    const stats = useMemo(() => {
        const total = courses.length;
        const completed = courses.filter(c => c.finished_lessons >= c.total_lessons).length;
        const inProgress = total - completed;
        const totalLessons = courses.reduce((sum, c) => sum + c.total_lessons, 0);
        const finishedLessons = courses.reduce((sum, c) => sum + c.finished_lessons, 0);
        return { total, completed, inProgress, totalLessons, finishedLessons };
    }, [courses]);

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
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    }, []);

    // 减少课时
    const handleDecrement = useCallback(async (id) => {
        const course = courses.find(c => c.id === id);
        if (!course || course.finished_lessons <= 0) return;

        try {
            const result = await coursesApi.setProgress(id, course.finished_lessons - 1);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    }, [courses]);

    // 删除课程
    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('确定要删除这门课程吗？')) return;

        try {
            await coursesApi.delete(id);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('删除失败:', err);
            alert('删除失败: ' + err.message);
        }
    }, []);

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
        if (!newCourse.title || !newCourse.total_lessons) {
            return alert('请填写课程名称和总课时');
        }

        try {
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
    }, [newCourse, selectedSubjectId]);

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
        } catch (err) {
            console.error('更新失败:', err);
            alert('更新失败: ' + err.message);
        }
    }, []);

    // 设置进度
    const handleSetProgress = useCallback(async (id, newProgress) => {
        try {
            const result = await coursesApi.setProgress(id, newProgress);
            setCourses(prev => prev.map(c =>
                c.id === id ? { ...c, finished_lessons: result.finished_lessons } : c
            ));
        } catch (err) {
            console.error('更新失败:', err);
            alert('操作失败: ' + err.message);
        }
    }, []);

    return {
        // 状态
        courses,
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

        // 设置函数
        setNewCourse,
        setCustomItemInput,
        setShowSubjectDropdown,

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
    };
}
