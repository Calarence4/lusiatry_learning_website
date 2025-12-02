const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取草稿列表
exports.getAllDrafts = async (req, res, next) => {
    try {
        const { status, subject } = req.query;

        let query = `
      SELECT 
        d.*,
        f.title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = d.subject) AS subject_path
      FROM drafts d
      LEFT JOIN file_tree f ON d.subject = f.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            query += ' AND d.status = ?';
            params.push(status);
        }

        if (subject) {
            query += ' AND d.subject = ?';
            params.push(subject);
        }

        query += ' ORDER BY d.updated_at DESC';

        const [rows] = await pool.query(query, params);

        // 解析 tags JSON
        rows.forEach(row => {
            if (row.tags) {
                try {
                    row.tags = JSON.parse(row.tags);
                } catch (e) {
                    row.tags = [];
                }
            } else {
                row.tags = [];
            }
        });

        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 获取单个草稿
exports.getDraftById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        d.*,
        f.title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = d.subject) AS subject_path
      FROM drafts d
      LEFT JOIN file_tree f ON d.subject = f.id
      WHERE d.id = ? 
    `;

        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return error(res, '草稿不存在', 404);
        }

        const draft = rows[0];
        if (draft.tags) {
            try {
                draft.tags = JSON.parse(draft.tags);
            } catch (e) {
                draft.tags = [];
            }
        } else {
            draft.tags = [];
        }

        success(res, draft);
    } catch (err) {
        next(err);
    }
};

// 创建草稿
exports.createDraft = async (req, res, next) => {
    try {
        const { title, content, subject, tags } = req.body;

        if (!title) {
            return error(res, '草稿标题为必填项', 400);
        }

        const [result] = await pool.query(
            'INSERT INTO drafts (title, content, subject, tags) VALUES (?, ?, ?, ?)',
            [title, content || null, subject || null, tags ? JSON.stringify(tags) : null]
        );

        success(res, { id: result.insertId }, '草稿创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 更新草稿
exports.updateDraft = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, subject, tags } = req.body;

        const [result] = await pool.query(
            'UPDATE drafts SET title = ?, content = ?, subject = ?, tags = ?  WHERE id = ?',
            [title, content || null, subject || null, tags ? JSON.stringify(tags) : null, id]
        );

        if (result.affectedRows === 0) {
            return error(res, '草稿不存在', 404);
        }

        success(res, null, '草稿更新成功');
    } catch (err) {
        next(err);
    }
};

// 归档草稿
exports.archiveDraft = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 获取草稿信息
        const [drafts] = await pool.query('SELECT * FROM drafts WHERE id = ?', [id]);

        if (drafts.length === 0) {
            return error(res, '草稿不存在', 404);
        }

        const draft = drafts[0];

        // 保存标题到归档表
        const [archiveResult] = await pool.query(
            'INSERT INTO archived_draft_titles (original_draft_id, title, subject, tags) VALUES (?, ?, ?, ?)',
            [draft.id, draft.title, draft.subject, draft.tags]
        );

        // 删除原草稿
        await pool.query('DELETE FROM drafts WHERE id = ?', [id]);

        success(res, { archived_title_id: archiveResult.insertId }, '草稿已归档');
    } catch (err) {
        next(err);
    }
};

// 删除草稿
exports.deleteDraft = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM drafts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return error(res, '草稿不存在', 404);
        }

        success(res, null, '草稿删除成功');
    } catch (err) {
        next(err);
    }
};

// 获取已归档草稿标题列表
exports.getArchivedTitles = async (req, res, next) => {
    try {
        const query = `
      SELECT 
        a.*,
        f. title AS subject_name,
        (SELECT path FROM v_selectable_subjects WHERE id = a.subject) AS subject_path
      FROM archived_draft_titles a
      LEFT JOIN file_tree f ON a.subject = f.id
      ORDER BY a.archived_at DESC
    `;

        const [rows] = await pool.query(query);

        // 解析 tags JSON
        rows.forEach(row => {
            if (row.tags) {
                try {
                    row.tags = JSON.parse(row.tags);
                } catch (e) {
                    row.tags = [];
                }
            } else {
                row.tags = [];
            }
        });

        success(res, rows);
    } catch (err) {
        next(err);
    }
};