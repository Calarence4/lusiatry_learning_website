# Lusiatry Learning Website 技术文档

## 项目架构

```
├── frontend/          # React 前端
├── backend/           # Express 后端
├── public/            # 静态资源
└── docs/              # 文档
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TailwindCSS |
| 后端 | Express.js |
| 数据库 | MySQL |
| 状态管理 | React Query |

## 数据库表结构

### study_time_logs - 学习时长记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| log_date | DATE | 记录日期 |
| subject | VARCHAR(100) | 一级学科名称 |
| duration | INT | 时长(分钟) |
| note | TEXT | 学习日志 |

### daily_tasks - 每日任务
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| title | VARCHAR(255) | 任务标题 |
| subject | VARCHAR(100) | 学科名称 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 截止日期 |
| ddl_time | TIME | 截止时间 |
| duration | INT | 预计时长(分钟) |
| is_longterm | BOOLEAN | 是否长期任务 |

### daily_task_logs - 任务完成记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| task_id | INT | 关联任务ID |
| log_date | DATE | 记录日期 |
| is_completed | BOOLEAN | 是否完成 |

### problems - 问题集
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| problem | TEXT | 问题描述 |
| answer | TEXT | 答案 |
| solution | TEXT | 解题过程 |
| is_solved | BOOLEAN | 是否已解决 |

### file_tree - 知识库文件树
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(255) | 文件/文件夹名 |
| parent_id | INT | 父节点ID |
| type | ENUM | file/folder |
| is_subject | BOOLEAN | 是否为学科节点 |

## API 接口

### 学习时长
- `GET /api/study-time` - 获取所有记录
- `GET /api/study-time/daily/:date` - 获取指定日期总时长
- `POST /api/study-time` - 创建记录

### 任务管理
- `GET /api/tasks` - 获取所有任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id/toggle` - 切换任务完成状态

### 问题集
- `GET /api/problems` - 获取所有问题
- `POST /api/problems` - 创建问题
- `PUT /api/problems/:id` - 更新问题(答案/解决方案)

### 知识库
- `GET /api/file-tree` - 获取文件树
- `GET /api/file-tree/today-count` - 今日新增文章数
- `POST /api/file-tree` - 创建节点

### 学科
- `GET /api/subjects` - 获取学科树(支持级联选择)

## 核心功能

### 1. 级联学科选择
- 点击显示一级学科
- 选择后显示子学科(如有)
- 数据库只存储一级学科名称

### 2. 今日专注时间
- 实时统计当日学习总时长
- 任务完成后自动刷新

### 3. 任务管理
- 支持长期/短期任务
- 超时任务红色高亮+删除线
- 已完成任务显示删除线

## 启动项目

```bash
# 后端
cd backend && npm install && npm start

# 前端
cd frontend && npm install && npm run dev
```

端口: 前端 5173 | 后端 3001
