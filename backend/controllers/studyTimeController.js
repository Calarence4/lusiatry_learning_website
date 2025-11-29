const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取学习时间记录
exports.getStudyTimeLogs = async (req, res, next) => {
    try {
        const { start_date, end_date, subject } = req.query;

        let query = 'SELECT * FROM study_time_logs WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND log_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND log_date <= ? ';
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

        if (group_by === 'subject') {
            query = `
        SELECT 
          s.subject,
          f.title AS subject_name,
          SUM(s.duration) AS total_duration
        FROM study_time_logs s
        LEFT JOIN file_tree f ON s.subject = f.id
        WHERE 1=1
      `;
        } else {
            // 默认按日期分组
            query = `
        SELECT 
          log_date,
          SUM(duration) AS total_duration
        FROM study_time_logs
        WHERE 1=1
      `;
        }

        if (start_date) {
            query += ' AND log_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND log_date <= ?';
            params.push(end_date);
        }

        if (group_by === 'subject') {
            query += ' GROUP BY s.subject, f.title ORDER BY total_duration DESC';
        } else {
            query += ' GROUP BY log_date ORDER BY log_date ASC';
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
        const { log_date, subject, duration } = req.body;

        if (!log_date || !duration) {
            return error(res, '日期和时长为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO study_time_logs (log_date, subject, duration) VALUES (?, ?, ? )',
            [log_date, subject || null, duration]
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