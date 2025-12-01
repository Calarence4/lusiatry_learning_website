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
};

// 任务 API
export const tasksApi = {
    getAll: (params) => api.get('/tasks', { params }).then(handleResponse),
    getById: (id) => api.get(`/tasks/${id}`).then(handleResponse),
    create: (data) => api.post('/tasks', data).then(handleResponse),
    update: (id, data) => api.put(`/tasks/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/tasks/${id}`).then(handleResponse),
};

// 学习时间 API
export const studyTimeApi = {
    getAll: (params) => api.get('/study-time', { params }).then(handleResponse),
    create: (data) => api.post('/study-time', data).then(handleResponse),
    getStats: () => api.get('/study-time/stats').then(handleResponse),
};

// 文件树 API
export const fileTreeApi = {
    getTree: () => api.get('/file-tree').then(handleResponse),
    getById: (id) => api.get(`/file-tree/${id}`).then(handleResponse),
    create: (data) => api.post('/file-tree', data).then(handleResponse),
    update: (id, data) => api.put(`/file-tree/${id}`, data).then(handleResponse),
    delete: (id) => api.delete(`/file-tree/${id}`).then(handleResponse),
    ensureDraftBox: () => api.get('/file-tree/draft-box').then(handleResponse),
};