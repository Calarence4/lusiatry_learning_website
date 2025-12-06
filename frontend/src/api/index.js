import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

// 通用响应处理
const handleResponse = (res) => {
    if (res.data.success) {
        return res.data.data;
    }
    throw new Error(res.data.message || '请求失败');
};

// 学科 API
export const subjectsApi = {
    getAll: () => api.get('/subjects').then(handleResponse),
    create: (data) => api.post('/subjects', data).then(handleResponse),
    update: (id, data) => api.put(`/subjects/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/subjects/${id}`).then(handleResponse),
};

// 草稿 API
export const draftsApi = {
    getAll: (params) => api.get('/drafts', { params }).then(handleResponse),
    create: (data) => api.post('/drafts', data).then(handleResponse),
    update: (id, data) => api.put(`/drafts/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/drafts/${id}`).then(handleResponse),
};

// 问题 API
export const problemsApi = {
    getAll: (params) => api.get('/problems', { params }).then(handleResponse),
    create: (data) => api.post('/problems', data).then(handleResponse),
    update: (id, data) => api.put(`/problems/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/problems/${id}`).then(handleResponse),
    solve: (id) => api.patch(`/problems/${id}/solve`).then(handleResponse),
    unsolve: (id) => api.patch(`/problems/${id}/unsolve`).then(handleResponse),
};

// 任务 API
export const tasksApi = {
    getAll: (params) => api.get('/tasks', { params }).then(handleResponse),
    getById: (id) => api.get(`/tasks/${id}`).then(handleResponse),
    getByDate: (date) => api.get(`/tasks/date/${date}`).then(handleResponse),
    getMonthLogs: (year, month) => api.get(`/tasks/month/${year}/${month}`).then(handleResponse),
    create: (data) => api.post('/tasks', data).then(handleResponse),
    update: (id, data) => api.put(`/tasks/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/tasks/${id}`).then(handleResponse),
    toggle: (id, date) => api.post(`/tasks/${id}/toggle`, { date }).then(handleResponse),
    exclude: (id, date) => api.post(`/tasks/${id}/exclude`, { date }).then(handleResponse),
    getProgress: (id) => api.get(`/tasks/${id}/progress`).then(handleResponse),
};

// 学习时间 API
export const studyTimeApi = {
    getAll: (params) => api.get('/study-time', { params }).then(handleResponse),
    getStats: (params) => api.get('/study-time/stats', { params }).then(handleResponse),
    create: (data) => api.post('/study-time', data).then(handleResponse),
    getDailyTotal: (date) => api.get(`/study-time/daily/${date}`).then(handleResponse),
};

// 文件树 API
export const fileTreeApi = {
    getTree: () => api.get('/file-tree').then(handleResponse),
    getById: (id) => api.get(`/file-tree/${id}`).then(handleResponse),
    create: (data) => api.post('/file-tree', data).then(handleResponse),
    update: (id, data) => api.put(`/file-tree/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/file-tree/${id}`).then(handleResponse),
    ensureDraftBox: () => api.get('/file-tree/draft-box').then(handleResponse),
    getTodayCount: () => api.get('/file-tree/today-count').then(handleResponse),
    batchImport: (data) => api.post('/file-tree/batch-import', data).then(handleResponse),
};

// 课程 API
export const coursesApi = {
    getAll: (params) => api.get('/courses', { params }).then(handleResponse),
    getById: (id) => api.get(`/courses/${id}`).then(handleResponse),
    getStats: () => api.get('/courses/stats').then(handleResponse),
    getActivity: (limit = 8) => api.get('/courses/activity', { params: { limit } }).then(handleResponse),
    getLogs: (id, limit) => api.get(`/courses/${id}/logs`, { params: { limit } }).then(handleResponse),
    create: (data) => api.post('/courses', data).then(handleResponse),
    update: (id, data) => api.put(`/courses/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/courses/${id}`).then(handleResponse),
    increment: (id, note) => api.patch(`/courses/${id}/increment`, { note }).then(handleResponse),
    setProgress: (id, finished_lessons, note) => api.patch(`/courses/${id}/progress`, { finished_lessons, note }).then(handleResponse),
    addLogNote: (courseId, logId, note) => api.patch(`/courses/${courseId}/logs/${logId}`, { note }).then(handleResponse),
};