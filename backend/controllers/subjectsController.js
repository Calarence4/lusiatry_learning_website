const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取可选学科列表
exports.getSelectableSubjects = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM v_selectable_subjects ORDER BY path');
        success(res, rows);
    } catch (err) {
        next(err);
    }
};