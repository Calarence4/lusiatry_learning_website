const API_BASE = '/api';

async function request(url, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || '请求失败');
    return data.data;
}

// ============================================
// 草稿 API
// ============================================
export const draftsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/drafts${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/drafts', { method: 'POST', body: data }),
};

// ============================================
// 问题 API
// ============================================
export const problemsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/problems${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/problems', { method: 'POST', body: data }),
    solve: (id) => request(`/problems/${id}/solve`, { method: 'PATCH' }),
    unsolve: (id) => request(`/problems/${id}/unsolve`, { method: 'PATCH' }),
};

// ============================================
// 学科 API
// ============================================
export const subjectsApi = {
    getAll: () => request('/subjects'),
};

// ============================================
// 知识库 API
// ============================================

// ============================================
// 学习时间 API
// ============================================
export const studyTimeApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/study-time${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/study-time', { method: 'POST', body: data }),
};

// ============================================
// 【确保有这个】打卡任务 API
// ============================================
export const tasksApi = {
    getAll: () => request('/tasks'),
    getById: (id) => request(`/tasks/${id}`),
    getByDate: (date) => request(`/tasks/date/${date}`),
    create: (data) => request('/tasks', { method: 'POST', body: data }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    toggle: (id, date) => request(`/tasks/${id}/toggle`, { method: 'POST', body: { date } }),
    exclude: (id, date) => request(`/tasks/${id}/exclude`, { method: 'POST', body: { date } }),
};

export const fileTreeApi = {
    getTree: () => request('/file-tree'),
    getById: (id) => request(`/file-tree/${id}`),
    create: (data) => request('/file-tree', { method: 'POST', body: data }),
    update: (id, data) => request(`/file-tree/${id}`, { method: 'PUT', body: data }),
    move: (id, newParentId) => request(`/file-tree/${id}/move`, { method: 'PATCH', body: { new_parent_id: newParentId } }),
    delete: (id) => request(`/file-tree/${id}`, { method: 'DELETE' }),
};