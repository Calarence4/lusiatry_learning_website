const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取课程列表（支持分页）
exports.getAllCourses = async (req, res, next) => {
    try {
        const { subject, status, page, limit } = req.query;
        
        // 分页参数
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 50;  // 默认50条，不分页时返回全部
        const offset = (pageNum - 1) * pageSize;
        const isPaginated = page && limit;

        let baseQuery = `
      FROM courses c
      LEFT JOIN file_tree f ON c.subject = f.id
      WHERE 1=1
    `;
        const params = [];

        if (subject) {
            baseQuery += ' AND c.subject = ?';
            params.push(subject);
        }

        if (status === 'completed') {
            baseQuery += ' AND c.finished_lessons >= c.total_lessons';
        } else if (status === 'in_progress') {
            baseQuery += ' AND c.finished_lessons < c.total_lessons';
        }

        // 获取总数
        let total = 0;
        if (isPaginated) {
            const [countResult] = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
            total = countResult[0].total;
        }

        // 获取数据
        let dataQuery = `
      SELECT 
        c.*,
        f.title AS subject_name,
        ROUND(c.finished_lessons / c.total_lessons * 100, 1) AS calc_progress
      ${baseQuery}
      ORDER BY c.created_at DESC
    `;
        
        if (isPaginated) {
            dataQuery += ' LIMIT ? OFFSET ?';
            params.push(pageSize, offset);
        }

        const [rows] = await pool.query(dataQuery, params);
        
        // 返回分页信息或直接返回数据
        if (isPaginated) {
            success(res, {
                list: rows,
                pagination: {
                    page: pageNum,
                    limit: pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            });
        } else {
            success(res, rows);
        }
    } catch (err) {
        next(err);
    }
};

// 获取单个课程
exports.getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        c.*,
        f.title AS subject_name,
        ROUND(c.finished_lessons / c.total_lessons * 100, 1) AS calc_progress
      FROM courses c
      LEFT JOIN file_tree f ON c.subject = f.id
      WHERE c.id = ?
    `;

        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return error(res, '课程不存在', 404);
        }

        success(res, rows[0]);
    } catch (err) {
        next(err);
    }
};

// 创建课程
exports.createCourse = async (req, res, next) => {
    try {
        const { title, subject, start_date, end_date, total_lessons, course_url, notes_path, color } = req.body;

        if (!title || !total_lessons) {
            return error(res, '课程名称和总课时为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO courses (title, subject, start_date, end_date, total_lessons, finished_lessons, progress, course_url, notes_path, color) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)',
            [title, subject || null, start_date || null, end_date || null, total_lessons, course_url || null, notes_path || null, color || null]
        );

        success(res, { id: result.insertId }, '课程创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 更新课程
exports.updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, subject, start_date, end_date, total_lessons, finished_lessons, course_url, notes_path, color } = req.body;

        // 计算进度百分比
        const progress = total_lessons > 0 ? ((finished_lessons || 0) / total_lessons * 100).toFixed(1) : 0;

        const [result] = await pool.query(
            'UPDATE courses SET title = ?, subject = ?, start_date = ?, end_date = ?, total_lessons = ?, finished_lessons = ?, progress = ?, course_url = ?, notes_path = ?, color = ? WHERE id = ?',
            [title, subject || null, start_date || null, end_date || null, total_lessons, finished_lessons || 0, progress, course_url || null, notes_path || null, color || null, id]
        );

        if (result.affectedRows === 0) {
            return error(res, '课程不存在', 404);
        }

        success(res, null, '课程更新成功');
    } catch (err) {
        next(err);
    }
};

// 进度 +1
exports.incrementProgress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 获取课程信息
        const [courses] = await pool.query('SELECT * FROM courses WHERE id = ? ', [id]);

        if (courses.length === 0) {
            return error(res, '课程不存在', 404);
        }

        const course = courses[0];
        let newFinished = course.finished_lessons + 1;

        // 不超过总课时
        if (newFinished > course.total_lessons) {
            newFinished = course.total_lessons;
        }

        const newProgress = (newFinished / course.total_lessons * 100).toFixed(1);

        await pool.query(
            'UPDATE courses SET finished_lessons = ?, progress = ?  WHERE id = ?',
            [newFinished, newProgress, id]
        );

        success(res, {
            finished_lessons: newFinished,
            progress: parseFloat(newProgress)
        });
    } catch (err) {
        next(err);
    }
};

// 直接设置进度
exports.setProgress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { finished_lessons } = req.body;

        if (finished_lessons === undefined) {
            return error(res, '已完成课时为必填项', 400);
        }

        // 获取课程信息
        const [courses] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);

        if (courses.length === 0) {
            return error(res, '课程不存在', 404);
        }

        const course = courses[0];

        // 验证范围
        if (finished_lessons < 0 || finished_lessons > course.total_lessons) {
            return error(res, `已完成课时必须在 0 到 ${course.total_lessons} 之间`, 400);
        }

        const newProgress = (finished_lessons / course.total_lessons * 100).toFixed(1);

        await pool.query(
            'UPDATE courses SET finished_lessons = ?, progress = ? WHERE id = ?',
            [finished_lessons, newProgress, id]
        );

        success(res, {
            finished_lessons,
            progress: parseFloat(newProgress)
        });
    } catch (err) {
        next(err);
    }
};

// 删除课程
exports.deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return error(res, '课程不存在', 404);
        }

        success(res, null, '课程删除成功');
    } catch (err) {
        next(err);
    }
};