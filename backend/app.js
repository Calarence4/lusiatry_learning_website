const express = require('express');
const cors = require('cors');
const compression = require('compression');
const app = express();

// 中间件
app.use(compression({  // 响应压缩 - 性能优化
    level: 6,
    threshold: 1024,  // 超过1KB才压缩
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/study-time', require('./routes/studyTime'));
app.use('/api/file-tree', require('./routes/fileTree'));
app.use('/api/courses', require('./routes/courses'));

// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: err.message || '服务器内部错误' });
});

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;