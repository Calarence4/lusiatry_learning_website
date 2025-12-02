import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { coursesApi } from '../api';

// 查询键
export const courseKeys = {
    all: ['courses'],
    list: (params) => ['courses', 'list', params],
    detail: (id) => ['courses', id],
};

// 获取所有课程（无分页）
export function useCourses(params) {
    return useQuery({
        queryKey: [...courseKeys.all, params],
        queryFn: () => coursesApi.getAll(params),
    });
}

// 获取课程列表（分页）
export function useCoursesPaginated({ page = 1, limit = 20, ...filters } = {}) {
    return useQuery({
        queryKey: courseKeys.list({ page, limit, ...filters }),
        queryFn: () => coursesApi.getAll({ page, limit, ...filters }),
        keepPreviousData: true,
    });
}

// 无限滚动加载课程
export function useCoursesInfinite(filters = {}) {
    return useInfiniteQuery({
        queryKey: ['courses', 'infinite', filters],
        queryFn: ({ pageParam = 1 }) => coursesApi.getAll({ page: pageParam, limit: 20, ...filters }),
        getNextPageParam: (lastPage) => {
            if (!lastPage.pagination) return undefined;
            const { page, totalPages } = lastPage.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
        initialPageParam: 1,
    });
}

// 获取单个课程
export function useCourse(id) {
    return useQuery({
        queryKey: courseKeys.detail(id),
        queryFn: () => coursesApi.getById(id),
        enabled: !!id,
    });
}

// 创建课程
export function useCreateCourse() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data) => coursesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.all });
        },
    });
}

// 更新课程
export function useUpdateCourse() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }) => coursesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.all });
        },
    });
}

// 删除课程
export function useDeleteCourse() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => coursesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: courseKeys.all });
        },
    });
}

// 增加进度
export function useIncrementCourse() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => coursesApi.increment(id),
        onSuccess: (data, id) => {
            // 乐观更新
            queryClient.setQueryData(courseKeys.all, (old) => {
                if (!old) return old;
                return old.map(course => 
                    course.id === id 
                        ? { ...course, finished_lessons: data.finished_lessons }
                        : course
                );
            });
        },
    });
}

// 设置进度
export function useSetCourseProgress() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, finished_lessons }) => coursesApi.setProgress(id, finished_lessons),
        onSuccess: (data, { id }) => {
            queryClient.setQueryData(courseKeys.all, (old) => {
                if (!old) return old;
                return old.map(course => 
                    course.id === id 
                        ? { ...course, finished_lessons: data.finished_lessons }
                        : course
                );
            });
        },
    });
}
