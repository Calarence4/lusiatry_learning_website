const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 构建学科树形结构
const buildSubjectTree = (subjects, parentId = null) => {
    const children = subjects.filter(s => s.parent_id === parentId);
    return children.map(subject => ({
        id: subject.id,
        title: subject.title,
        children: buildSubjectTree(subjects, subject.id)
    }));
};

// 获取可选学科列表（树形结构）
exports.getSelectableSubjects = async (req, res, next) => {
    try {
        // 直接查询所有标记为学科的记录
        const [rows] = await pool.query(`
            SELECT id, title, parent_id 
            FROM file_tree 
            WHERE is_subject = 1 
            ORDER BY title
        `);

        // 构建树形结构，只返回一级学科（包含子学科）
        const subjectTree = buildSubjectTree(rows);

        success(res, subjectTree);
    } catch (err) {
        next(err);
    }
};