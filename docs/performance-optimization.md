# Lusiatry 学习网站 - 性能优化方案

> 文档版本: 1.2  
> 创建日期: 2025年  
> 更新日期: 2025年12月1日  
> 状态: 大部分已实施

---

## 实施进度

| 优化项 | 状态 | 备注 |
|--------|------|------|
| 路由懒加载 | ✅ 已完成 | App.jsx - React.lazy() |
| Vite构建优化 | ✅ 已完成 | vite.config.js - manualChunks函数 |
| 响应压缩 | ✅ 已完成 | compression中间件 |
| 数据库索引 | ✅ 已完成 | indexes_simple.sql |
| N+1查询修复 | ✅ 已完成 | fileTreeController CTE优化 |
| 组件拆分 | ✅ 已完成 | Course/ 模块化拆分 |
| React Query | ✅ 已完成 | 请求缓存 hooks |
| API分页 | ✅ 已完成 | courses/tasks 分页支持 |

### 已完成优化详情

#### 1. Course.jsx 模块拆分 (2025-12-01)
原1146行大文件已拆分为：
```
src/pages/Course/
├── index.jsx              # 主组件 (~480行)
├── constants.js           # 颜色常量和工具函数
├── EditableProgress.jsx   # 可编辑进度组件
├── EditCourseModal.jsx    # 编辑课程模态框
└── useCourseData.js       # 自定义Hook - 数据管理
```

#### 2. Vite构建分包 (2025-12-01)
构建产物分析：
- `vendor-react` - React核心 (357KB)
- `vendor-ui` - UI库 (114KB)
- `vendor-utils` - 工具库 (60KB)
- 页面组件按需加载

#### 3. React Query 集成 (2025-12-01)
```
src/hooks/
├── index.js           # 统一导出
├── useCourses.js      # 课程数据hooks
├── useSubjects.js     # 学科数据hooks
└── useTasks.js        # 任务数据hooks
```
配置特性：
- 5分钟 staleTime（数据新鲜期）
- 10分钟 gcTime（缓存保留）
- 自动缓存共享，避免重复请求
- 乐观更新支持

#### 4. API 分页支持 (2025-12-01)
后端支持：
- `GET /api/courses?page=1&limit=20` - 课程分页
- `GET /api/tasks?page=1&limit=20` - 任务分页
- 返回 `{ list, pagination: { page, limit, total, totalPages } }`
- 向后兼容：不传分页参数返回全部数据

前端 hooks：
- `useCoursesPaginated()` - 分页查询
- `useCoursesInfinite()` - 无限滚动
- `useTasksPaginated()` - 任务分页

---

## 目录

1. [概述](#概述)
2. [前端优化](#前端优化)
   - [代码分割与懒加载](#1-代码分割与懒加载)
   - [组件拆分](#2-组件拆分)
   - [请求优化](#3-请求优化)
   - [渲染优化](#4-渲染优化)
   - [构建优化](#5-构建优化)
3. [后端优化](#后端优化)
   - [数据库索引](#1-数据库索引)
   - [查询优化](#2-查询优化)
   - [API设计优化](#3-api设计优化)
   - [中间件优化](#4-中间件优化)
4. [优先级排序](#优先级排序)
5. [实施计划](#实施计划)

---

## 概述

### 项目技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + React Router |
| 构建工具 | Vite |
| 样式方案 | Tailwind CSS |
| 动画库 | Framer Motion |
| HTTP客户端 | Axios |
| 后端框架 | Express.js |
| 数据库 | MySQL (mysql2) |

### 当前问题概览

| 类别 | 问题数量 | 影响程度 |
|------|----------|----------|
| 前端性能 | 8 | 高 |
| 后端性能 | 6 | 中-高 |
| 构建配置 | 3 | 中 |

---

## 前端优化

### 1. 代码分割与懒加载

#### 问题描述
当前 `App.jsx` 中所有路由组件都是同步导入，导致首屏加载时需要下载所有页面代码。

#### 当前代码
```jsx
// App.jsx - 当前实现
import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import News from './pages/News';
import Questions from './pages/Questions';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import Course from './pages/Course';
```

#### 优化方案
```jsx
// App.jsx - 优化后
import { lazy, Suspense } from 'react';

// 懒加载页面组件
const Home = lazy(() => import('./pages/Home'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const News = lazy(() => import('./pages/News'));
const Questions = lazy(() => import('./pages/Questions'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Course = lazy(() => import('./pages/Course'));

// 加载状态组件
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
);

// 在Routes中使用Suspense包裹
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* 其他路由... */}
  </Routes>
</Suspense>
```

#### 预期收益
- 首屏加载体积减少 **40-60%**
- 首次内容绘制(FCP)时间显著降低

---

### 2. 组件拆分

#### 问题描述
`Course.jsx` 当前有 **1146 行代码**，包含过多职责，影响维护性和性能。

#### 当前结构分析
```
Course.jsx (1146行)
├── EditCourseModal 组件 (~200行)
├── EditableProgress 组件 (~80行)
├── CourseCard 组件 (~150行)
├── 主组件状态管理 (~100行)
├── API调用逻辑 (~150行)
└── 渲染逻辑 (~400行+)
```

#### 优化方案：拆分为独立模块

```
src/pages/Course/
├── index.jsx              # 主组件入口
├── CourseCard.jsx         # 课程卡片组件
├── EditCourseModal.jsx    # 编辑模态框
├── EditableProgress.jsx   # 可编辑进度组件
├── CourseFilters.jsx      # 筛选器组件
├── useCourseData.js       # 自定义Hook - 数据获取
└── courseUtils.js         # 工具函数
```

#### 自定义Hook示例
```jsx
// useCourseData.js
import { useState, useEffect, useCallback } from 'react';
import api from '@/api';

export function useCourseData(selectedSubject) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.courses.getAll();
      setCourses(response.data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    if (!selectedSubject) return courses;
    return courses.filter(c => c.subject === selectedSubject);
  }, [courses, selectedSubject]);

  return { courses: filteredCourses, loading, error, refetch: fetchCourses };
}
```

---

### 3. 请求优化

#### 问题3.1：重复API请求

**问题描述**  
`Home.jsx` 和 `LearningRecorder.jsx` 都独立请求相同数据（drafts、problems、studyTime）。

**优化方案A：使用 React Query**
```bash
npm install @tanstack/react-query
```

```jsx
// src/main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5分钟内数据不过期
      cacheTime: 10 * 60 * 1000,     // 缓存保留10分钟
      refetchOnWindowFocus: false,    // 窗口聚焦不重新请求
    },
  },
});

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

```jsx
// 使用示例 - hooks/useProblems.js
import { useQuery } from '@tanstack/react-query';
import api from '@/api';

export function useProblems() {
  return useQuery({
    queryKey: ['problems'],
    queryFn: () => api.problems.getAll().then(res => res.data.data),
  });
}

// 任何组件使用同一个key，数据自动共享
function Component1() {
  const { data: problems } = useProblems();
}

function Component2() {
  const { data: problems } = useProblems(); // 不会重复请求
}
```

**优化方案B：使用 Context + Reducer（轻量替代）**
```jsx
// contexts/DataContext.jsx
const DataContext = createContext();

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  
  // 全局数据获取，只执行一次
  useEffect(() => {
    fetchAllData(dispatch);
  }, []);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}
```

#### 问题3.2：缺少请求取消

**问题描述**  
组件卸载时，正在进行的请求没有取消，可能导致内存泄漏。

**优化方案**
```jsx
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const response = await api.courses.getAll({
        signal: controller.signal
      });
      setCourses(response.data.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    }
  };
  
  fetchData();
  
  return () => controller.abort(); // 组件卸载时取消请求
}, []);
```

---

### 4. 渲染优化

#### 问题4.1：缺少 React.memo

**问题描述**  
子组件（如 CourseCard、EditableProgress）没有使用 memo 包裹，父组件每次更新都会导致子组件重新渲染。

**优化方案**
```jsx
// CourseCard.jsx
import { memo } from 'react';

const CourseCard = memo(function CourseCard({ course, onEdit, onDelete }) {
  // 组件内容
});

// 对于回调函数，需要在父组件使用 useCallback
const handleEdit = useCallback((course) => {
  setEditingCourse(course);
  setShowEditModal(true);
}, []);
```

#### 问题4.2：列表渲染优化

**问题描述**  
大量课程时，每次状态更新都会重新渲染整个列表。

**优化方案**
```jsx
// 使用 useMemo 缓存列表渲染结果
const courseCards = useMemo(() => (
  filteredCourses.map(course => (
    <CourseCard 
      key={course.id}
      course={course}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ))
), [filteredCourses, handleEdit, handleDelete]);
```

#### 问题4.3：虚拟滚动（大数据量场景）

如果课程数量超过100条，建议使用虚拟滚动：
```bash
npm install @tanstack/react-virtual
```

---

### 5. 构建优化

#### 问题描述
当前 `vite.config.js` 配置较为基础，未启用代码分割和压缩优化。

#### 当前配置
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

#### 优化配置
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' }),  // Gzip压缩
  ],
  
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库分离
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-utils': ['axios', 'date-fns'],
        },
      },
    },
    
    // 构建优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // 移除console
        drop_debugger: true,     // 移除debugger
      },
    },
    
    // 分块大小警告阈值
    chunkSizeWarningLimit: 500,
  },
  
  server: {
    port: 3000,
  },
})
```

#### 图片资源优化

**问题**：背景图片从外部URL加载
```jsx
// 当前
backgroundImage: `url('https://images.unsplash.com/...')`
```

**优化方案**
1. 将图片下载到本地 `public/images/`
2. 使用WebP格式减少体积
3. 实现懒加载

```jsx
// 图片懒加载组件
const LazyBackgroundImage = ({ src, className, children }) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [src]);
  
  return (
    <div 
      className={className}
      style={{
        backgroundImage: loaded ? `url(${src})` : 'none',
        backgroundColor: loaded ? 'transparent' : '#f0f0f0',
      }}
    >
      {children}
    </div>
  );
};
```

---

## 后端优化

### 1. 数据库索引

#### 问题描述
频繁查询的字段缺少索引，导致全表扫描。

#### 需要添加的索引

```sql
-- 任务表：按日期范围查询
CREATE INDEX idx_daily_tasks_dates ON daily_tasks(start_date, end_date);
CREATE INDEX idx_daily_tasks_subject ON daily_tasks(subject);

-- 问题表：按状态筛选
CREATE INDEX idx_problems_is_solved ON problems(is_solved);
CREATE INDEX idx_problems_subject ON problems(subject);

-- 学习时间表：按日期和科目统计
CREATE INDEX idx_study_time_date_subject ON study_time_logs(log_date, subject);

-- 文件树表：按父节点查询子节点
CREATE INDEX idx_file_tree_parent ON file_tree(parent_id);
CREATE INDEX idx_file_tree_type ON file_tree(type);

-- 课程表：按科目筛选
CREATE INDEX idx_courses_subject ON courses(subject);
```

#### 验证索引效果
```sql
-- 查看查询执行计划
EXPLAIN SELECT * FROM daily_tasks 
WHERE start_date >= '2024-01-01' AND end_date <= '2024-12-31';
```

---

### 2. 查询优化

#### 问题2.1：N+1 查询问题

**问题位置**：`fileTreeController.js` - 递归删除

**当前代码**
```javascript
const deleteRecursive = async (nodeId) => {
  const [children] = await db.query(
    'SELECT id FROM file_tree WHERE parent_id = ?', [nodeId]
  );
  for (const child of children) {
    await deleteRecursive(child.id);  // 每个子节点一次查询
  }
  await db.query('DELETE FROM file_tree WHERE id = ?', [nodeId]);
};
```

**优化方案：使用递归CTE一次性获取所有后代**
```javascript
// 使用 MySQL 8.0+ 递归CTE
const deleteNodeWithDescendants = async (nodeId) => {
  await db.query(`
    WITH RECURSIVE descendants AS (
      SELECT id FROM file_tree WHERE id = ?
      UNION ALL
      SELECT ft.id FROM file_tree ft
      INNER JOIN descendants d ON ft.parent_id = d.id
    )
    DELETE FROM file_tree WHERE id IN (SELECT id FROM descendants)
  `, [nodeId]);
};
```

#### 问题2.2：子查询转JOIN

**问题位置**：`tasksController.js`

**优化前（使用子查询）**
```javascript
const [subjects] = await db.query(`
  SELECT id, name, 
    (SELECT full_path FROM subjects_with_path WHERE id = subjects.id) as path
  FROM subjects
`);
```

**优化后（使用JOIN）**
```javascript
const [subjects] = await db.query(`
  SELECT s.id, s.name, CONCAT_WS('/', p.name, s.name) as path
  FROM subjects s
  LEFT JOIN subjects p ON s.parent_id = p.id
`);
```

---

### 3. API设计优化

#### 问题3.1：缺少分页

**问题描述**  
`getAll` 类型的API返回全部数据，数据量大时影响性能。

**优化方案**
```javascript
// coursesController.js
const getAllCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const [courses] = await db.query(
      `SELECT * FROM courses ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM courses'
    );
    
    success(res, {
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
```

#### 问题3.2：缺少字段筛选

**优化方案**
```javascript
// 支持只返回需要的字段
const getAllCourses = async (req, res, next) => {
  const fields = req.query.fields 
    ? req.query.fields.split(',').filter(f => allowedFields.includes(f))
    : ['*'];
  
  const [courses] = await db.query(
    `SELECT ${fields.join(',')} FROM courses`
  );
  // ...
};
```

---

### 4. 中间件优化

#### 问题4.1：缺少响应压缩

**优化方案**
```bash
npm install compression
```

```javascript
// app.js
const compression = require('compression');

app.use(compression({
  level: 6,  // 压缩级别
  threshold: 1024,  // 超过1KB才压缩
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

#### 问题4.2：缺少速率限制

**优化方案**
```bash
npm install express-rate-limit
```

```javascript
// app.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,  // 每个IP最多100次请求
  message: { error: '请求过于频繁，请稍后再试' }
});

app.use('/api/', limiter);
```

#### 问题4.3：添加请求日志

```bash
npm install morgan
```

```javascript
// app.js
const morgan = require('morgan');

// 开发环境详细日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // 生产环境精简日志
  app.use(morgan('combined'));
}
```

---

## 优先级排序

### 🔴 高优先级 (立即实施)

| 优化项 | 预期收益 | 实施难度 | 建议时间 |
|--------|----------|----------|----------|
| 路由懒加载 | 首屏加载减少40%+ | 低 | 1小时 |
| 数据库索引 | 查询速度提升10x+ | 低 | 30分钟 |
| 引入React Query | 消除重复请求 | 中 | 2小时 |
| 响应压缩 | 传输体积减少60%+ | 低 | 15分钟 |

### 🟡 中优先级 (本周完成)

| 优化项 | 预期收益 | 实施难度 | 建议时间 |
|--------|----------|----------|----------|
| Course.jsx拆分 | 维护性提升 | 中 | 4小时 |
| Vite构建优化 | 生产包体积减少30% | 低 | 1小时 |
| N+1查询修复 | 批量删除性能提升 | 中 | 1小时 |
| API分页 | 大数据量性能保障 | 中 | 2小时 |

### 🟢 低优先级 (计划中)

| 优化项 | 预期收益 | 实施难度 | 建议时间 |
|--------|----------|----------|----------|
| React.memo优化 | 渲染性能提升 | 低 | 2小时 |
| 速率限制 | 安全性提升 | 低 | 30分钟 |
| 图片本地化 | 加载稳定性 | 低 | 1小时 |
| Service Worker | 离线支持 | 高 | 8小时 |

---

## 实施计划

### 第一阶段：快速见效 (第1天)

```
1. ✅ 添加数据库索引（30分钟）
2. ✅ 添加响应压缩中间件（15分钟）
3. ✅ 实现路由懒加载（1小时）
4. ✅ 更新vite.config.js构建配置（30分钟）
```

### 第二阶段：核心优化 (第2-3天)

```
1. ⏳ 安装并配置React Query（2小时）
2. ⏳ 拆分Course.jsx为模块（4小时）
3. ⏳ 修复N+1查询问题（1小时）
4. ⏳ 实现API分页（2小时）
```

### 第三阶段：精细优化 (第4-5天)

```
1. 📋 添加React.memo和useCallback
2. 📋 实现速率限制
3. 📋 图片资源本地化和懒加载
4. 📋 添加请求日志
```

### 第四阶段：高级功能 (后续)

```
1. 📋 Service Worker离线支持
2. 📋 数据预取策略
3. 📋 性能监控集成
```

---

## 性能监控

### 推荐工具

| 工具 | 用途 | 集成难度 |
|------|------|----------|
| Lighthouse | 前端性能评分 | 无需集成 |
| React DevTools Profiler | React渲染分析 | 浏览器扩展 |
| MySQL EXPLAIN | SQL查询分析 | 无需集成 |
| Chrome Network Tab | 网络请求分析 | 无需集成 |

### 关键指标

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| First Contentful Paint (FCP) | < 1.5s | 待测量 |
| Largest Contentful Paint (LCP) | < 2.5s | 待测量 |
| Time to Interactive (TTI) | < 3.5s | 待测量 |
| Bundle Size (gzipped) | < 200KB | 待测量 |

---

## 附录

### A. 依赖安装命令

```bash
# 前端依赖
cd frontend
npm install @tanstack/react-query
npm install -D vite-plugin-compression2

# 后端依赖
cd backend
npm install compression express-rate-limit morgan
```

### B. 相关文件清单

**需要修改的前端文件：**
- `frontend/src/App.jsx` - 添加懒加载
- `frontend/src/main.jsx` - 配置QueryClient
- `frontend/vite.config.js` - 构建优化
- `frontend/src/pages/Course.jsx` - 拆分为模块

**需要修改的后端文件：**
- `backend/app.js` - 添加中间件
- `backend/controllers/fileTreeController.js` - 修复N+1
- `backend/controllers/*.js` - 添加分页支持

**需要执行的SQL：**
- 索引创建脚本（见上文）

---

*文档结束*
