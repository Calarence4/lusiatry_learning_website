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

        // 使用递归CTE一次性获取所有后代节点并删除 - 性能优化
        // 注意：MySQL 8.0+ 支持递归CTE
        await pool.query(`
            WITH RECURSIVE descendants AS (
                SELECT id FROM file_tree WHERE id = ?
                UNION ALL
                SELECT ft.id FROM file_tree ft
                INNER JOIN descendants d ON ft.parent_id = d.id
            )
            DELETE FROM file_tree WHERE id IN (SELECT id FROM descendants)
        `, [id]);

        success(res, { message: '删除成功' });
    } catch (err) {
        // 如果MySQL版本不支持递归CTE，回退到原有方法
        if (err.code === 'ER_PARSE_ERROR' || err.errno === 1064) {
            try {
                const deleteRecursive = async (nodeId) => {
                    const [children] = await pool.query(
                        'SELECT id FROM file_tree WHERE parent_id = ?',
                        [nodeId]
                    );
                    for (const child of children) {
                        await deleteRecursive(child.id);
                    }
                    await pool.query('DELETE FROM file_tree WHERE id = ?', [nodeId]);
                };
                await deleteRecursive(req.params.id);
                return success(res, { message: '删除成功' });
            } catch (fallbackErr) {
                console.error('delete fallback error:', fallbackErr);
                return next(fallbackErr);
            }
        }
        console.error('delete error:', err);
        next(err);
    }
};

// 批量导入笔记
exports.batchImport = async (req, res, next) => {
    try {
        const { items, targetFolderId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return error(res, '导入数据不能为空', 400);
        }

        // 限制单次导入数量
        if (items.length > 500) {
            return error(res, '单次最多导入500个文件', 400);
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [],
            imported: []
        };

        // 用于存储路径到ID的映射（处理文件夹层级）
        const pathToIdMap = new Map();

        // 如果指定了目标文件夹，先验证其存在
        if (targetFolderId) {
            const [folder] = await pool.query(
                'SELECT id, type FROM file_tree WHERE id = ?',
                [targetFolderId]
            );
            if (folder.length === 0 || folder[0].type !== 'folder') {
                return error(res, '目标文件夹不存在', 400);
            }
            pathToIdMap.set('', targetFolderId);
        }

        // 按路径深度排序，确保父文件夹先创建
        const sortedItems = [...items].sort((a, b) => {
            const depthA = (a.path || '').split('/').filter(Boolean).length;
            const depthB = (b.path || '').split('/').filter(Boolean).length;
            return depthA - depthB;
        });

        // 开始事务
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of sortedItems) {
                try {
                    const { title, content, type, path } = item;

                    if (!title) {
                        results.failed++;
                        results.errors.push({ title: item.title || '未知', error: '标题为空' });
                        continue;
                    }

                    // 确定父文件夹ID
                    let parentId = targetFolderId || null;

                    if (path) {
                        const pathParts = path.split('/').filter(Boolean);
                        let currentPath = '';

                        // 创建路径中的文件夹
                        for (const folderName of pathParts) {
                            const parentPath = currentPath;
                            currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

                            if (!pathToIdMap.has(currentPath)) {
                                // 检查该文件夹是否已存在
                                const existingParentId = pathToIdMap.get(parentPath) || targetFolderId || null;
                                const [existing] = await connection.query(
                                    'SELECT id FROM file_tree WHERE title = ? AND type = ? AND parent_id <=> ?',
                                    [folderName, 'folder', existingParentId]
                                );

                                if (existing.length > 0) {
                                    pathToIdMap.set(currentPath, existing[0].id);
                                } else {
                                    // 创建文件夹
                                    const [result] = await connection.query(
                                        `INSERT INTO file_tree (title, type, parent_id, is_subject, is_system, content)
                                         VALUES (?, 'folder', ?, 0, 0, NULL)`,
                                        [folderName, existingParentId]
                                    );
                                    pathToIdMap.set(currentPath, result.insertId);
                                }
                            }
                            parentId = pathToIdMap.get(currentPath);
                        }
                    }

                    // 创建文件或文件夹
                    const itemType = type || 'file';
                    const [result] = await connection.query(
                        `INSERT INTO file_tree (title, type, parent_id, is_subject, is_system, content)
                         VALUES (?, ?, ?, 0, 0, ?)`,
                        [title, itemType, parentId, itemType === 'file' ? (content || '') : null]
                    );

                    results.success++;
                    results.imported.push({
                        id: result.insertId,
                        title,
                        type: itemType,
                        path: path || ''
                    });
                } catch (itemErr) {
                    results.failed++;
                    results.errors.push({ title: item.title || '未知', error: itemErr.message });
                }
            }

            await connection.commit();
        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }

        success(res, results, 201);
    } catch (err) {
        console.error('batchImport error:', err);
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

// 获取今日新增笔记数量（不包括草稿箱内的）
exports.getTodayCount = async (req, res, next) => {
    try {
        // 获取草稿箱ID
        const [draftBox] = await pool.query(
            'SELECT id FROM file_tree WHERE is_system = 1 AND title = ?',
            ['草稿箱']
        );
        const draftBoxId = draftBox.length > 0 ? draftBox[0].id : null;

        // 获取草稿箱下所有文件的ID（包括子文件夹中的）
        let excludeIds = [];
        if (draftBoxId) {
            const getDescendants = async (parentId) => {
                const [children] = await pool.query(
                    'SELECT id FROM file_tree WHERE parent_id = ?',
                    [parentId]
                );
                let ids = [parentId];
                for (const child of children) {
                    const childIds = await getDescendants(child.id);
                    ids = ids.concat(childIds);
                }
                return ids;
            };
            excludeIds = await getDescendants(draftBoxId);
        }

        // 查询今日新增的文件（type = 'file'，不在草稿箱内）
        let query = `
            SELECT COUNT(*) as count 
            FROM file_tree 
            WHERE type = 'file' 
            AND DATE(created_at) = CURDATE()
        `;

        if (excludeIds.length > 0) {
            query += ` AND id NOT IN (${excludeIds.join(',')}) AND (parent_id IS NULL OR parent_id NOT IN (${excludeIds.join(',')}))`;
        }

        const [rows] = await pool.query(query);
        success(res, { count: rows[0].count });
    } catch (err) {
        console.error('getTodayCount error:', err);
        next(err);
    }
};