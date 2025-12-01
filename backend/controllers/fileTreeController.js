const pool = require('../config/db');

const success = (res, data, status = 200) => {
    res.status(status).json({ success: true, data });
};

const error = (res, message, status = 400) => {
    res.status(status).json({ success: false, message });
};

// 获取文件树
exports.getFileTree = async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
      SELECT id, title, type, parent_id, is_subject, is_system, created_at, updated_at
      FROM file_tree
      ORDER BY is_system DESC, type DESC, title ASC
    `);

        const buildTree = (nodes, parentId = null) => {
            return nodes
                .filter(node => node.parent_id === parentId)
                .map(node => ({
                    ...node,
                    children: buildTree(nodes, node.id)
                }));
        };

        const tree = buildTree(rows);
        success(res, tree);
    } catch (err) {
        console.error('getFileTree error:', err);
        next(err);
    }
};

// 获取单个文件
exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ? ',
            [id]
        );

        if (rows.length === 0) {
            return error(res, '文件不存在', 404);
        }

        success(res, rows[0]);
    } catch (err) {
        console.error('getById error:', err);
        next(err);
    }
};

// 创建
exports.create = async (req, res, next) => {
    try {
        const { title, type, parent_id, is_subject, content } = req.body;

        if (!title || !type) {
            return error(res, '标题和类型为必填项', 400);
        }

        const [result] = await pool.query(
            `INSERT INTO file_tree (title, type, parent_id, is_subject, is_system, content)
       VALUES (?, ?, ?, ?, 0, ?)`,
            [title, type, parent_id || null, is_subject || 0, content || null]
        );

        const [newItem] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ?',
            [result.insertId]
        );

        success(res, newItem[0], 201);
    } catch (err) {
        console.error('create error:', err);
        next(err);
    }
};

// 更新
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, is_subject } = req.body;

        // 检查是否为系统文件夹
        const [existing] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return error(res, '文件不存在', 404);
        }

        // 系统草稿箱不允许重命名
        if (existing[0].is_system && title && title !== existing[0].title) {
            return error(res, '系统文件夹不可重命名', 403);
        }

        const updates = [];
        const values = [];

        if (title !== undefined && !existing[0].is_system) {
            updates.push('title = ?');
            values.push(title);
        }
        if (content !== undefined) {
            updates.push('content = ? ');
            values.push(content);
        }
        if (is_subject !== undefined && !existing[0].is_system) {
            updates.push('is_subject = ? ');
            values.push(is_subject ? 1 : 0);
        }

        if (updates.length === 0) {
            return error(res, '没有要更新的字段', 400);
        }

        values.push(id);

        await pool.query(
            `UPDATE file_tree SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? `,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ? ',
            [id]
        );

        success(res, updated[0]);
    } catch (err) {
        console.error('update error:', err);
        next(err);
    }
};

// 删除
exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 检查是否为系统文件夹
        const [existing] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ? ',
            [id]
        );

        if (existing.length === 0) {
            return error(res, '文件不存在', 404);
        }

        if (existing[0].is_system) {
            return error(res, '系统文件夹不可删除', 403);
        }

        // 递归删除
        const deleteRecursive = async (nodeId) => {
            const [children] = await pool.query(
                'SELECT id FROM file_tree WHERE parent_id = ? ',
                [nodeId]
            );

            for (const child of children) {
                await deleteRecursive(child.id);
            }

            await pool.query('DELETE FROM file_tree WHERE id = ?', [nodeId]);
        };

        await deleteRecursive(id);

        success(res, { message: '删除成功' });
    } catch (err) {
        console.error('delete error:', err);
        next(err);
    }
};

// 确保系统草稿箱存在
exports.ensureDraftBox = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT id FROM file_tree WHERE is_system = 1 AND title = ?',
            ['草稿箱']
        );

        if (rows.length === 0) {
            const [result] = await pool.query(
                `INSERT INTO file_tree (title, type, parent_id, is_subject, is_system, content)
         VALUES ('草稿箱', 'folder', NULL, 0, 1, NULL)`
            );
            success(res, { id: result.insertId, created: true });
        } else {
            success(res, { id: rows[0].id, created: false });
        }
    } catch (err) {
        console.error('ensureDraftBox error:', err);
        next(err);
    }
};