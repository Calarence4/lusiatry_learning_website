import { addHours, format, subDays, startOfWeek, startOfMonth, startOfYear, addDays } from 'date-fns';

// 1. 知识库目录树 (保持不变)
export const MOCK_FILE_TREE = [
    {
        id: 'root-cs', title: '计算机', type: 'folder', isSubject: true,
        children: [
            {
                id: 'cs-web', title: '网页开发', type: 'folder', isSubject: true, children: [
                    { id: 'cs-react', title: 'React', type: 'folder', isSubject: true, children: [] }
                ]
            }
        ]
    },
    {
        id: 'root-music', title: '音乐', type: 'folder', isSubject: true,
        children: [
            { id: 'inst-guitar', title: '吉他', type: 'folder', isSubject: true, children: [] }
        ]
    }
];

// 辅助：获取当前时间 N 小时后的 HH:mm
const getDeadlineInHours = (hours) => format(addHours(new Date(), hours), 'HH:mm');

// 辅助：生成过去某天的日期字符串
const daysAgo = (days) => format(subDays(new Date(), days), 'yyyy-MM-dd');

// 定义特定日期：11月27日
const SPECIFIC_DATE = "2025-11-27";

// 2. 打卡任务数据 (固定在 11.27 的 7 个任务)
export const MOCK_TASKS_DATA = [
    // --- 11.27 特定日期的任务 (7个) ---
    { id: 1, title: "React Hooks 深度解析", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "React", progress: 90, deadline: "10:00", duration: 2.5 },
    { id: 101, title: "每日英语听力 (BBC)", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "英语", progress: 0, deadline: "09:00", duration: 0.5 },
    { id: 102, title: "LeetCode 每日一题", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "算法", progress: 0, deadline: "23:59", duration: 1.0 },
    { id: 103, title: "项目周报撰写", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "工作", progress: 20, deadline: "18:00", duration: 0.5 },
    { id: 104, title: "阅读《设计心理学》", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "设计", progress: 0, deadline: "", duration: 1.0 },
    { id: 105, title: "健身环大冒险 30min", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "健康", progress: 0, deadline: "21:00", duration: 0.5 },
    { id: 106, title: "整理 Obsidian 笔记", startDate: SPECIFIC_DATE, endDate: SPECIFIC_DATE, category: "管理", progress: 0, deadline: "", duration: 0.5 },

    // --- 过去/未来任务 (保持原样用于图表统计) ---
    { id: 2, title: "LeetCode 动态规划", startDate: daysAgo(1), endDate: daysAgo(1), category: "算法", progress: 100, deadline: "22:00", duration: 1.5 },
    { id: 3, title: "Figma 组件库搭建", startDate: daysAgo(2), endDate: daysAgo(2), category: "设计", progress: 50, deadline: "20:00", duration: 3.0 },
    { id: 4, title: "英语口语练习", startDate: daysAgo(3), endDate: daysAgo(3), category: "英语", progress: 30, deadline: "", duration: 0.5 },
    { id: 5, title: "Next.js 路由机制", startDate: daysAgo(1), endDate: daysAgo(1), category: "React", progress: 80, deadline: "", duration: 2.0 },
    { id: 6, title: "二叉树遍历算法", startDate: daysAgo(4), endDate: daysAgo(4), category: "算法", progress: 100, deadline: "", duration: 1.0 },

    // --- 本月数据 ---
    { id: 11, title: "Node.js 事件循环", startDate: daysAgo(10), endDate: daysAgo(10), category: "后端", progress: 100, deadline: "", duration: 4.0 },
    { id: 12, title: "色彩理论基础", startDate: daysAgo(15), endDate: daysAgo(15), category: "设计", progress: 100, deadline: "", duration: 2.5 },
    { id: 13, title: "React 源码阅读", startDate: daysAgo(20), endDate: daysAgo(20), category: "React", progress: 60, deadline: "", duration: 5.0 },

    // --- 本年数据 ---
    { id: 21, title: "微服务架构设计", startDate: daysAgo(100), endDate: daysAgo(100), category: "架构", progress: 100, deadline: "", duration: 10.0 },
    { id: 22, title: "Docker 容器化部署", startDate: daysAgo(150), endDate: daysAgo(150), category: "运维", progress: 100, deadline: "", duration: 6.0 },
];

// 3. 笔记草稿数据
export const INITIAL_DRAFTS = [
    {
        id: 'd1',
        title: 'TypeScript 泛型笔记',
        subject: '计算机/网页开发/前端',
        createdAt: daysAgo(2),
        content: '泛型约束使用 extends 关键字...',
        status: 'pending'
    }
];

// 4. 问题集数据
export const MOCK_QUESTIONS = [
    {
        id: 'q1',
        title: 'React useEffect 的依赖数组为空和不写的区别？',
        subject: '前端开发/React',
        status: 'unresolved',
        createdAt: daysAgo(1),
        solution: ''
    },
    {
        id: 'q2',
        title: '矩阵的秩与线性方程组解的个数有什么几何关系？',
        subject: '数学基础/线性代数',
        status: 'resolved',
        createdAt: daysAgo(5),
        solution: '秩等于未知数个数时有唯一解。'
    }
];

export const flattenFiles = (nodes) => {
    let files = [];
    nodes.forEach(node => {
        if (node.type === 'file') files.push(node);
        if (node.children) files = files.concat(flattenFiles(node.children));
    });
    return files;
};