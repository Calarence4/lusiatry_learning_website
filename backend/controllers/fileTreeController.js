const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取文件树
exports.getFileTree = async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
      SELECT id, title, type, parent_id, is_subject, content, created_at, updated_at
      FROM file_tree
      ORDER BY type DESC, title ASC
    `);

        // 构建树结构
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
        next(err);
    }
};

// 获取单个文件/文件夹
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
        next(err);
    }
};

// 创建文件/文件夹
exports.create = async (req, res, next) => {
    try {
        const { title, type, parent_id, is_subject, content } = req.body;

        if (!title || !type) {
            return error(res, '标题和类型为必填项', 400);
        }

        const [result] = await pool.query(
            `INSERT INTO file_tree (title, type, parent_id, is_subject, content)
       VALUES (?, ?, ?, ?, ?)`,
            [title, type, parent_id || null, is_subject || 0, content || null]
        );

        const [newItem] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ?',
            [result.insertId]
        );

        success(res, newItem[0], 201);
    } catch (err) {
        next(err);
    }
};

// 更新文件/文件夹
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, is_subject } = req.body;

        // 检查是否存在
        const [existing] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ? ',
            [id]
        );

        if (existing.length === 0) {
            return error(res, '文件不存在', 404);
        }

        // 构建更新字段
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }
        if (is_subject !== undefined) {
            updates.push('is_subject = ?');
            values.push(is_subject ? 1 : 0);
        }

        if (updates.length === 0) {
            return error(res, '没有要更新的字段', 400);
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await pool.query(
            `UPDATE file_tree SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const [updated] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ? ',
            [id]
        );

        success(res, updated[0]);
    } catch (err) {
        next(err);
    }
};

// 移动文件/文件夹
exports.move = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_parent_id } = req.body;

        // 检查是否存在
        const [existing] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return error(res, '文件不存在', 404);
        }

        // 防止移动到自己的子节点下
        if (new_parent_id) {
            const [parent] = await pool.query(
                'SELECT * FROM file_tree WHERE id = ? ',
                [new_parent_id]
            );
            if (parent.length === 0) {
                return error(res, '目标文件夹不存在', 404);
            }
        }

        await pool.query(
            'UPDATE file_tree SET parent_id = ?, updated_at = NOW() WHERE id = ?',
            [new_parent_id || null, id]
        );

        success(res, { message: '移动成功' });
    } catch (err) {
        next(err);
    }
};

// 删除文件/文件夹（递归删除子节点）
exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 检查是否存在
        const [existing] = await pool.query(
            'SELECT * FROM file_tree WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return error(res, '文件不存在', 404);
        }

        // 递归删除所有子节点
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
        next(err);
    }
};