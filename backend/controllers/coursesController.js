const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取课程列表
exports.getAllCourses = async (req, res, next) => {
    try {
        const { subject, status } = req.query;

        let query = `
      SELECT 
        c.*,
        f.title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = c.subject) AS subject_path,
        ROUND(c.finished_lessons / c.total_lessons * 100, 1) AS progress
      FROM courses c
      LEFT JOIN file_tree f ON c.subject = f.id
      WHERE 1=1
    `;
        const params = [];

        if (subject) {
            query += ' AND c.subject = ?';
            params.push(subject);
        }

        if (status === 'completed') {
            query += ' AND c. finished_lessons >= c.total_lessons';
        } else if (status === 'in_progress') {
            query += ' AND c.finished_lessons < c.total_lessons';
        }

        query += ' ORDER BY c.created_at DESC';

        const [rows] = await pool.query(query, params);
        success(res, rows);
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
        (SELECT path FROM v_selectable_subjects WHERE id = c. subject) AS subject_path,
        ROUND(c.finished_lessons / c. total_lessons * 100, 1) AS progress
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
        const { title, subject, start_date, end_date, total_lessons } = req.body;

        if (!title || !total_lessons) {
            return error(res, '课程名称和总课时为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO courses (title, subject, start_date, end_date, total_lessons, finished_lessons, process) VALUES (?, ?, ?, ?, ?, 0, 0)',
            [title, subject || null, start_date || null, end_date || null, total_lessons]
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
        const { title, subject, start_date, end_date, total_lessons } = req.body;

        const [result] = await pool.query(
            'UPDATE courses SET title = ?, subject = ?, start_date = ?, end_date = ?, total_lessons = ? WHERE id = ?',
            [title, subject || null, start_date || null, end_date || null, total_lessons, id]
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
            'UPDATE courses SET finished_lessons = ?, process = ?  WHERE id = ?',
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
            'UPDATE courses SET finished_lessons = ?, process = ? WHERE id = ? ',
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