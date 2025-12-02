const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取学习时间记录
exports.getStudyTimeLogs = async (req, res, next) => {
    try {
        const { start_date, end_date, subject } = req.query;

        let query = 'SELECT * FROM study_time_logs WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND DATE(CONVERT_TZ(log_date, \'+00:00\', \'+08:00\')) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(CONVERT_TZ(log_date, \'+00:00\', \'+08:00\')) <= ?';
            params.push(end_date);
        }

        if (subject) {
            query += ' AND subject = ?';
            params.push(subject);
        }

        query += ' ORDER BY log_date DESC, created_at DESC';

        const [rows] = await pool.query(query, params);
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 获取统计数据
exports.getStudyTimeStats = async (req, res, next) => {
    try {
        const { start_date, end_date, group_by } = req.query;

        let query;
        const params = [];
        const isSubjectGroup = group_by === 'subject';
        const dateField = isSubjectGroup ? 's.log_date' : 'log_date';

        if (isSubjectGroup) {
            // 按学科名称分组，只统计有效学科（存在于 file_tree 且 is_subject=1 的节点）
            query = `
                SELECT 
                    s.subject AS subject_name,
                    SUM(s.duration) AS total_duration
                FROM study_time_logs s
                INNER JOIN file_tree f ON s.subject = f.title AND f.is_subject = 1
                WHERE s.subject IS NOT NULL AND s.subject != ''
            `;
        } else {
            // 默认按日期分组
            query = `
                SELECT 
                    DATE(CONVERT_TZ(log_date, '+00:00', '+08:00')) AS log_date,
                    SUM(duration) AS total_duration
                FROM study_time_logs
                WHERE 1=1
            `;
        }

        if (start_date) {
            query += ` AND DATE(CONVERT_TZ(${dateField}, '+00:00', '+08:00')) >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            query += ` AND DATE(CONVERT_TZ(${dateField}, '+00:00', '+08:00')) <= ?`;
            params.push(end_date);
        }

        if (isSubjectGroup) {
            query += ' GROUP BY s.subject ORDER BY total_duration DESC';
        } else {
            query += ' GROUP BY DATE(CONVERT_TZ(log_date, \'+00:00\', \'+08:00\')) ORDER BY log_date ASC';
        }

        const [rows] = await pool.query(query, params);
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 记录学习时间
exports.createStudyTimeLog = async (req, res, next) => {
    try {
        const { log_date, subject, duration, note } = req.body;

        if (!log_date) {
            return error(res, '日期为必填项', 400);
        }

        if (!subject) {
            return error(res, '学科为必填项', 400);
        }

        if (!duration || duration <= 0) {
            return error(res, '学习时长为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO study_time_logs (log_date, subject, duration, note) VALUES (?, ?, ?, ?)',
            [log_date, subject, duration, note || null]
        );

        success(res, { id: result.insertId }, '学习时间记录成功', 201);
    } catch (err) {
        next(err);
    }
};

// 删除记录
exports.deleteStudyTimeLog = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM study_time_logs WHERE id = ? ', [id]);

        if (result.affectedRows === 0) {
            return error(res, '记录不存在', 404);
        }

        success(res, null, '记录删除成功');
    } catch (err) {
        next(err);
    }
};

// 获取指定日期的学习总时长
exports.getDailyTotal = async (req, res, next) => {
    try {
        const { date } = req.params;
        
        if (!date) {
            return error(res, '日期为必填项', 400);
        }

        const [rows] = await pool.query(
            'SELECT COALESCE(SUM(duration), 0) as total_duration FROM study_time_logs WHERE log_date = ?',
            [date]
        );

        success(res, { 
            date,
            total_duration: rows[0].total_duration 
        });
    } catch (err) {
        next(err);
    }
};