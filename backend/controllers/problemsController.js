const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取问题列表
exports.getAllProblems = async (req, res, next) => {
    try {
        const { status, subject } = req.query;

        let query = `
      SELECT 
        p.*,
        f.title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = p.subject) AS subject_path
      FROM problems p
      LEFT JOIN file_tree f ON p.subject = f.id
      WHERE 1=1
    `;
        const params = [];

        if (status !== undefined) {
            query += ' AND p.is_solved = ?';
            params.push(status);
        }

        if (subject) {
            query += ' AND p.subject = ?';
            params.push(subject);
        }

        query += ' ORDER BY p.date DESC';

        const [rows] = await pool.query(query, params);
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 获取单个问题
exports.getProblemById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        p.*,
        f. title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = p.subject) AS subject_path
      FROM problems p
      LEFT JOIN file_tree f ON p. subject = f.id
      WHERE p. id = ?
    `;

        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return error(res, '问题不存在', 404);
        }

        success(res, rows[0]);
    } catch (err) {
        next(err);
    }
};

// 创建问题
exports.createProblem = async (req, res, next) => {
    try {
        const { problem, content, subject, source } = req.body;

        if (!problem) {
            return error(res, '问题标题为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO problems (problem, content, subject, source, date) VALUES (?, ?, ?, ?, CURDATE())',
            [problem, content || null, subject || null, source || null]
        );

        success(res, { id: result.insertId }, '问题创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 更新问题
exports.updateProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { problem, content, subject, source } = req.body;

        const [result] = await pool.query(
            'UPDATE problems SET problem = ?, content = ?, subject = ?, source = ?  WHERE id = ?',
            [problem, content || null, subject || null, source || null, id]
        );

        if (result.affectedRows === 0) {
            return error(res, '问题不存在', 404);
        }

        success(res, null, '问题更新成功');
    } catch (err) {
        next(err);
    }
};

// 标记为已解决
exports.solveProblem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE problems SET is_solved = 1, resolved_at = NOW() WHERE id = ? ',
            [id]
        );

        if (result.affectedRows === 0) {
            return error(res, '问题不存在', 404);
        }

        success(res, null, '问题已标记为已解决');
    } catch (err) {
        next(err);
    }
};

// 标记为未解决
exports.unsolveProblem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'UPDATE problems SET is_solved = 0, resolved_at = NULL WHERE id = ? ',
            [id]
        );

        if (result.affectedRows === 0) {
            return error(res, '问题不存在', 404);
        }

        success(res, null, '问题已标记为未解决');
    } catch (err) {
        next(err);
    }
};

// 为已解决问题添加草稿
exports.addDraftToProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, subject, tags } = req.body;

        // 验证问题是否已解决
        const [problems] = await pool.query('SELECT * FROM problems WHERE id = ?', [id]);

        if (problems.length === 0) {
            return error(res, '问题不存在', 404);
        }

        if (!problems[0].is_solved) {
            return error(res, '只能为已解决的问题添加草稿', 400);
        }

        // 创建草稿
        const [draftResult] = await pool.query(
            'INSERT INTO drafts (title, content, subject, tags) VALUES (?, ?, ?, ?)',
            [title, content || null, subject || null, tags ? JSON.stringify(tags) : null]
        );

        // 关联到问题
        await pool.query(
            'UPDATE problems SET related_draft_id = ? WHERE id = ?',
            [draftResult.insertId, id]
        );

        success(res, { draft_id: draftResult.insertId }, '草稿创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 为已解决问题添加笔记
exports.addNoteToProblem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { parent_id, title, content } = req.body;

        // 验证问题是否已解决
        const [problems] = await pool.query('SELECT * FROM problems WHERE id = ? ', [id]);

        if (problems.length === 0) {
            return error(res, '问题不存在', 404);
        }

        if (!problems[0].is_solved) {
            return error(res, '只能为已解决的问题添加笔记', 400);
        }

        // 验证父文件夹
        if (parent_id) {
            const [parents] = await pool.query('SELECT * FROM file_tree WHERE id = ?  AND type = ? ', [parent_id, 'folder']);
            if (parents.length === 0) {
                return error(res, '父文件夹不存在', 400);
            }
        }

        // 创建笔记文件
        const [noteResult] = await pool.query(
            'INSERT INTO file_tree (parent_id, title, type, content) VALUES (?, ?, ?, ?)',
            [parent_id || null, title, 'file', content || null]
        );

        // 关联到问题
        await pool.query(
            'UPDATE problems SET related_note_id = ? WHERE id = ?',
            [noteResult.insertId, id]
        );

        success(res, { note_id: noteResult.insertId }, '笔记创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 删除问题
exports.deleteProblem = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM problems WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return error(res, '问题不存在', 404);
        }

        success(res, null, '问题删除成功');
    } catch (err) {
        next(err);
    }
};