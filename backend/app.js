const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// 路由
const tasksRoutes = require('./routes/tasks');
const studyTimeRoutes = require('./routes/studyTime');
const problemsRoutes = require('./routes/problems');
const draftsRoutes = require('./routes/drafts');
const coursesRoutes = require('./routes/courses');
const fileTreeRoutes = require('./routes/fileTree');
const subjectsRoutes = require('./routes/subjects');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/tasks', tasksRoutes);
app.use('/api/study-time', studyTimeRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/file-tree', fileTreeRoutes);
app.use('/api/subjects', subjectsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 API 文档: http://localhost:${PORT}/api/health`);
});