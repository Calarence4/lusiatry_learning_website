import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api';

// 查询键
export const subjectKeys = {
    all: ['subjects'],
    detail: (id) => ['subjects', id],
};

// 获取所有学科
export function useSubjects() {
    return useQuery({
        queryKey: subjectKeys.all,
        queryFn: () => subjectsApi.getAll(),
    });
}

// 创建学科
export function useCreateSubject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data) => subjectsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.all });
        },
    });
}

// 更新学科
export function useUpdateSubject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }) => subjectsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.all });
        },
    });
}

// 删除学科
export function useDeleteSubject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => subjectsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subjectKeys.all });
        },
    });
}
