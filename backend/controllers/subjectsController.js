const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 构建学科路径的辅助函数
const buildSubjectPath = (subjects, parentId = null, parentPath = '') => {
    const result = [];
    const children = subjects.filter(s => s.parent_id === parentId);

    for (const subject of children) {
        const path = parentPath ? `${parentPath} / ${subject.title}` : subject.title;
        result.push({ id: subject.id, title: subject.title, path });
        // 递归处理子学科
        result.push(...buildSubjectPath(subjects, subject.id, path));
    }

    return result;
};

// 获取可选学科列表
exports.getSelectableSubjects = async (req, res, next) => {
    try {
        // 直接查询所有标记为学科的记录
        const [rows] = await pool.query(`
            SELECT id, title, parent_id 
            FROM file_tree 
            WHERE is_subject = 1 
            ORDER BY title
        `);

        // 构建带路径的学科列表
        const subjectsWithPath = buildSubjectPath(rows);

        success(res, subjectsWithPath);
    } catch (err) {
        next(err);
    }
};