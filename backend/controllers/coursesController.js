const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 自动计算课程状态
const calculateStatus = (finished, total) => {
    if (finished === 0) return 'not_started';
    if (finished >= total) return 'completed';
    return 'in_progress';
};

// 获取课程列表（支持分页和状态筛选）
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

        // 使用新的 status 字段筛选
        if (status === 'completed') {
            baseQuery += ' AND c.status = "completed"';
        } else if (status === 'in_progress') {
            baseQuery += ' AND c.status = "in_progress"';
        } else if (status === 'not_started') {
            baseQuery += ' AND c.status = "not_started"';
        } else if (status === 'paused') {
            baseQuery += ' AND c.status = "paused"';
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

// 预设颜色列表（与前端保持一致，跳过默认null）
const PRESET_COLORS = ['indigo', 'emerald', 'amber', 'rose', 'sky', 'violet', 'cyan', 'orange'];

// 创建课程
exports.createCourse = async (req, res, next) => {
    try {
        const { title, subject, start_date, end_date, total_lessons, course_url, notes_path, color } = req.body;

        if (!title || !total_lessons) {
            return error(res, '课程名称和总课时为必填项', 400);
        }

        // 如果没有指定颜色，根据现有课程数量自动分配
        let assignedColor = color;
        if (!assignedColor) {
            const [countResult] = await pool.query('SELECT COUNT(*) as count FROM courses');
            const courseCount = countResult[0].count;
            assignedColor = PRESET_COLORS[courseCount % PRESET_COLORS.length];
        }

        // 新课程默认状态为 not_started
        const status = 'not_started';

        const [result] = await pool.query(
            'INSERT INTO courses (title, subject, start_date, end_date, total_lessons, finished_lessons, progress, course_url, notes_path, color, status) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)',
            [title, subject || null, start_date || null, end_date || null, total_lessons, course_url || null, notes_path || null, assignedColor, status]
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
        const { title, subject, start_date, end_date, total_lessons, finished_lessons, course_url, notes_path, color, status: manualStatus } = req.body;

        // 获取旧课程数据
        const [oldCourse] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
        if (oldCourse.length === 0) {
            return error(res, '课程不存在', 404);
        }

        // 计算进度百分比
        const newFinished = finished_lessons !== undefined ? finished_lessons : oldCourse[0].finished_lessons;
        const newTotal = total_lessons || oldCourse[0].total_lessons;
        const progress = newTotal > 0 ? ((newFinished) / newTotal * 100).toFixed(1) : 0;
        
        // 状态：如果手动设置了 paused，则使用手动状态；否则根据进度自动计算
        // paused 状态只能手动设置，其他状态都是自动计算的
        let status;
        if (manualStatus === 'paused') {
            status = 'paused';
        } else {
            status = calculateStatus(newFinished, newTotal);
        }

        // 如果进度有变化，记录日志
        if (oldCourse[0].finished_lessons !== newFinished) {
            await pool.query(
                'INSERT INTO course_logs (course_id, prev_lessons, new_lessons, log_date) VALUES (?, ?, ?, CURDATE())',
                [id, oldCourse[0].finished_lessons, newFinished]
            );
        }

        const [result] = await pool.query(
            'UPDATE courses SET title = ?, subject = ?, start_date = ?, end_date = ?, total_lessons = ?, finished_lessons = ?, progress = ?, course_url = ?, notes_path = ?, color = ?, status = ? WHERE id = ?',
            [title, subject || null, start_date || null, end_date || null, newTotal, newFinished, progress, course_url || null, notes_path || null, color || null, status, id]
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
        const { note } = req.body; // 可选的学习笔记

        // 获取课程信息
        const [courses] = await pool.query('SELECT * FROM courses WHERE id = ? ', [id]);

        if (courses.length === 0) {
            return error(res, '课程不存在', 404);
        }

        const course = courses[0];
        const prevFinished = course.finished_lessons;
        let newFinished = course.finished_lessons + 1;

        // 不超过总课时
        if (newFinished > course.total_lessons) {
            newFinished = course.total_lessons;
        }

        const newProgress = (newFinished / course.total_lessons * 100).toFixed(1);
        const newStatus = calculateStatus(newFinished, course.total_lessons);

        await pool.query(
            'UPDATE courses SET finished_lessons = ?, progress = ?, status = ? WHERE id = ?',
            [newFinished, newProgress, newStatus, id]
        );

        // 记录进度日志
        await pool.query(
            'INSERT INTO course_logs (course_id, prev_lessons, new_lessons, note, log_date) VALUES (?, ?, ?, ?, CURDATE())',
            [id, prevFinished, newFinished, note || null]
        );

        success(res, {
            finished_lessons: newFinished,
            progress: parseFloat(newProgress),
            status: newStatus
        });
    } catch (err) {
        next(err);
    }
};

// 直接设置进度
exports.setProgress = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { finished_lessons, note } = req.body;

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
        const newStatus = calculateStatus(finished_lessons, course.total_lessons);

        await pool.query(
            'UPDATE courses SET finished_lessons = ?, progress = ?, status = ? WHERE id = ?',
            [finished_lessons, newProgress, newStatus, id]
        );

        // 如果进度有变化，记录日志
        if (course.finished_lessons !== finished_lessons) {
            await pool.query(
                'INSERT INTO course_logs (course_id, prev_lessons, new_lessons, note, log_date) VALUES (?, ?, ?, ?, CURDATE())',
                [id, course.finished_lessons, finished_lessons, note || null]
            );
        }

        success(res, {
            finished_lessons,
            progress: parseFloat(newProgress),
            status: newStatus
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

// 获取课程进度日志
exports.getCourseLogs = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;

        let query = `
            SELECT 
                cl.*,
                c.title AS course_title,
                c.total_lessons
            FROM course_logs cl
            JOIN courses c ON cl.course_id = c.id
            WHERE cl.course_id = ?
            ORDER BY cl.created_at DESC
        `;
        const params = [id];

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [rows] = await pool.query(query, params);
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 添加进度日志笔记
exports.addLogNote = async (req, res, next) => {
    try {
        const { id, logId } = req.params;
        const { note } = req.body;

        const [result] = await pool.query(
            'UPDATE course_logs SET note = ? WHERE id = ? AND course_id = ?',
            [note, logId, id]
        );

        if (result.affectedRows === 0) {
            return error(res, '日志不存在', 404);
        }

        success(res, null, '笔记保存成功');
    } catch (err) {
        next(err);
    }
};

// 获取课程统计（按状态）
exports.getCourseStats = async (req, res, next) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(total_lessons) as total_lessons,
                SUM(finished_lessons) as finished_lessons
            FROM courses
        `);

        success(res, stats[0]);
    } catch (err) {
        next(err);
    }
};