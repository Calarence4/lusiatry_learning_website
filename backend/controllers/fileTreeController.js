const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 构建树形结构
const buildTree = (items, parentId = null) => {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
            ...item,
            children: buildTree(items, item.id)
        }));
};

// 获取完整目录树
exports.getFileTree = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, parent_id, title, type, is_subject, allow_as_category, sort_order FROM file_tree ORDER BY sort_order ASC, id ASC'
        );

        const tree = buildTree(rows);
        success(res, tree);
    } catch (err) {
        next(err);
    }
};

// 获取单个节点详情
exports.getNodeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query('SELECT * FROM file_tree WHERE id = ? ', [id]);

        if (rows.length === 0) {
            return error(res, '节点不存在', 404);
        }

        success(res, rows[0]);
    } catch (err) {
        next(err);
    }
};

// 创建节点
exports.createNode = async (req, res, next) => {
    try {
        const { parent_id, title, type, is_subject, allow_as_category, content, sort_order } = req.body;

        if (!title || !type) {
            return error(res, '名称和类型为必填项', 400);
        }

        if (type !== 'folder' && type !== 'file') {
            return error(res, '类型必须是 folder 或 file', 400);
        }

        // 验证父节点
        if (parent_id) {
            const [parents] = await pool.query('SELECT * FROM file_tree WHERE id = ?  AND type = ?', [parent_id, 'folder']);
            if (parents.length === 0) {
                return error(res, '父文件夹不存在', 400);
            }
        }

        const [result] = await pool.query(
            'INSERT INTO file_tree (parent_id, title, type, is_subject, allow_as_category, content, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                parent_id || null,
                title,
                type,
                type === 'folder' ? (is_subject ? 1 : 0) : 0,
                type === 'folder' ? (allow_as_category !== false ? 1 : 0) : 0,
                type === 'file' ? (content || null) : null,
                sort_order || 0
            ]
        );

        success(res, { id: result.insertId }, '节点创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 更新节点
exports.updateNode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, is_subject, allow_as_category, content, sort_order } = req.body;

        // 获取当前节点
        const [nodes] = await pool.query('SELECT * FROM file_tree WHERE id = ?', [id]);

        if (nodes.length === 0) {
            return error(res, '节点不存在', 404);
        }

        const node = nodes[0];

        const [result] = await pool.query(
            'UPDATE file_tree SET title = ?, is_subject = ?, allow_as_category = ?, content = ?, sort_order = ? WHERE id = ?',
            [
                title || node.title,
                node.type === 'folder' ? (is_subject !== undefined ? (is_subject ? 1 : 0) : node.is_subject) : 0,
                node.type === 'folder' ? (allow_as_category !== undefined ? (allow_as_category ? 1 : 0) : node.allow_as_category) : 0,
                node.type === 'file' ? (content !== undefined ? content : node.content) : null,
                sort_order !== undefined ? sort_order : node.sort_order,
                id
            ]
        );

        success(res, null, '节点更新成功');
    } catch (err) {
        next(err);
    }
};

// 移动节点
exports.moveNode = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_parent_id } = req.body;

        // 获取当前节点
        const [nodes] = await pool.query('SELECT * FROM file_tree WHERE id = ?', [id]);

        if (nodes.length === 0) {
            return error(res, '节点不存在', 404);
        }

        // 验证新父节点
        if (new_parent_id) {
            const [parents] = await pool.query('SELECT * FROM file_tree WHERE id = ? AND type = ?', [new_parent_id, 'folder']);
            if (parents.length === 0) {
                return error(res, '目标文件夹不存在', 400);
            }

            // 防止移动到自己的子节点下
            const [descendants] = await pool.query(`
        WITH RECURSIVE descendants AS (
          SELECT id FROM file_tree WHERE id = ?
          UNION ALL
          SELECT f.id FROM file_tree f INNER JOIN descendants d ON f.parent_id = d.id
        )
        SELECT id FROM descendants
      `, [id]);

            const descendantIds = descendants.map(d => d.id);
            if (descendantIds.includes(new_parent_id)) {
                return error(res, '不能将节点移动到其子节点下', 400);
            }
        }

        await pool.query('UPDATE file_tree SET parent_id = ?  WHERE id = ?', [new_parent_id || null, id]);

        success(res, null, '节点移动成功');
    } catch (err) {
        next(err);
    }
};

// 删除节点
exports.deleteNode = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM file_tree WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return error(res, '节点不存在', 404);
        }

        success(res, null, '节点删除成功');
    } catch (err) {
        next(err);
    }
};