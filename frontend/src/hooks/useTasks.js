import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { tasksApi } from '../api';

// 查询键
export const taskKeys = {
    all: ['tasks'],
    list: (params) => ['tasks', 'list', params],
    byDate: (date) => ['tasks', 'date', date],
    detail: (id) => ['tasks', id],
    progress: (id) => ['tasks', id, 'progress'],
};

// 获取所有任务（无分页）
export function useTasks(params) {
    return useQuery({
        queryKey: [...taskKeys.all, params],
        queryFn: () => tasksApi.getAll(params),
    });
}

// 获取任务列表（分页）
export function useTasksPaginated({ page = 1, limit = 20 } = {}) {
    return useQuery({
        queryKey: taskKeys.list({ page, limit }),
        queryFn: () => tasksApi.getAll({ page, limit }),
        keepPreviousData: true,
    });
}

// 获取指定日期的任务
export function useTasksByDate(date) {
    return useQuery({
        queryKey: taskKeys.byDate(date),
        queryFn: () => tasksApi.getByDate(date),
        enabled: !!date,
    });
}

// 获取单个任务
export function useTask(id) {
    return useQuery({
        queryKey: taskKeys.detail(id),
        queryFn: () => tasksApi.getById(id),
        enabled: !!id,
    });
}

// 获取任务进度
export function useTaskProgress(id) {
    return useQuery({
        queryKey: taskKeys.progress(id),
        queryFn: () => tasksApi.getProgress(id),
        enabled: !!id,
    });
}

// 创建任务
export function useCreateTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data) => tasksApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });
}

// 更新任务
export function useUpdateTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }) => tasksApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });
}

// 删除任务
export function useDeleteTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => tasksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
        },
    });
}

// 切换任务完成状态
export function useToggleTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, date }) => tasksApi.toggle(id, date),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            if (date) {
                queryClient.invalidateQueries({ queryKey: taskKeys.byDate(date) });
            }
        },
    });
}

// 排除任务日期
export function useExcludeTask() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, date }) => tasksApi.exclude(id, date),
        onSuccess: (_, { date }) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.all });
            if (date) {
                queryClient.invalidateQueries({ queryKey: taskKeys.byDate(date) });
            }
        },
    });
}
