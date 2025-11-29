const pool = require('../config/db');
const { success, error } = require('../utils/response');

// 获取所有任务
exports.getAllTasks = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM daily_tasks ORDER BY id DESC');
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 获取单个任务
exports.getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM daily_tasks WHERE id = ?', [id]);

        if (rows.length === 0) {
            return error(res, '任务不存在', 404);
        }

        success(res, rows[0]);
    } catch (err) {
        next(err);
    }
};

// 获取指定日期的任务
exports.getTasksByDate = async (req, res, next) => {
    try {
        const { date } = req.params;

        const query = `
      SELECT 
        t.*,
        COALESCE(l.is_completed, 0) AS is_completed,
        COALESCE(l.is_excluded, 0) AS is_excluded
      FROM daily_tasks t
      LEFT JOIN daily_task_logs l ON t.id = l.task_id AND l.log_date = ?
      WHERE 
        (t.is_longterm = 1 AND t.start_date <= ? AND t.end_date >= ?)
        OR (t.is_longterm = 0 AND t. start_date = ?)
      HAVING is_excluded = 0
      ORDER BY t.ddl_time ASC
    `;

        const [rows] = await pool.query(query, [date, date, date, date]);
        success(res, rows);
    } catch (err) {
        next(err);
    }
};

// 创建任务
exports.createTask = async (req, res, next) => {
    try {
        const { name, subject, start_date, end_date, ddl_time, is_longterm } = req.body;

        if (!name || !start_date) {
            return error(res, '任务名称和开始日期为必填项', 400);
        }

        // 单日任务时，end_date 等于 start_date
        const finalEndDate = is_longterm ? end_date : start_date;

        const [result] = await pool.query(
            'INSERT INTO daily_tasks (name, subject, start_date, end_date, ddl_time, is_longterm) VALUES (?, ?, ?, ?, ?, ?)',
            [name, subject || null, start_date, finalEndDate, ddl_time || null, is_longterm ? 1 : 0]
        );

        success(res, { id: result.insertId }, '任务创建成功', 201);
    } catch (err) {
        next(err);
    }
};

// 更新任务
exports.updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, subject, start_date, end_date, ddl_time, is_longterm } = req.body;

        const finalEndDate = is_longterm ? end_date : start_date;

        const [result] = await pool.query(
            'UPDATE daily_tasks SET name = ?, subject = ?, start_date = ?, end_date = ?, ddl_time = ?, is_longterm = ? WHERE id = ? ',
            [name, subject || null, start_date, finalEndDate, ddl_time || null, is_longterm ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return error(res, '任务不存在', 404);
        }

        success(res, null, '任务更新成功');
    } catch (err) {
        next(err);
    }
};

// 删除任务
exports.deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM daily_tasks WHERE id = ? ', [id]);

        if (result.affectedRows === 0) {
            return error(res, '任务不存在', 404);
        }

        success(res, null, '任务删除成功');
    } catch (err) {
        next(err);
    }
};

// 切换任务完成状态
exports.toggleTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.body;

        if (!date) {
            return error(res, '日期为必填项', 400);
        }

        // 查询现有记录
        const [existing] = await pool.query(
            'SELECT * FROM daily_task_logs WHERE task_id = ? AND log_date = ?',
            [id, date]
        );

        let isCompleted;

        if (existing.length > 0) {
            // 切换状态
            isCompleted = existing[0].is_completed ? 0 : 1;
            await pool.query(
                'UPDATE daily_task_logs SET is_completed = ?  WHERE task_id = ? AND log_date = ?',
                [isCompleted, id, date]
            );
        } else {
            // 插入新记录
            isCompleted = 1;
            await pool.query(
                'INSERT INTO daily_task_logs (task_id, log_date, is_completed) VALUES (?, ?, ?)',
                [id, date, isCompleted]
            );
        }

        success(res, { is_completed: isCompleted === 1 });
    } catch (err) {
        next(err);
    }
};

// 排除任务
exports.excludeTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.body;

        if (!date) {
            return error(res, '日期为必填项', 400);
        }

        // 查询现有记录
        const [existing] = await pool.query(
            'SELECT * FROM daily_task_logs WHERE task_id = ? AND log_date = ?',
            [id, date]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE daily_task_logs SET is_excluded = 1 WHERE task_id = ? AND log_date = ? ',
                [id, date]
            );
        } else {
            await pool.query(
                'INSERT INTO daily_task_logs (task_id, log_date, is_excluded) VALUES (?, ?, 1)',
                [id, date]
            );
        }

        success(res, null, '任务已从当天排除');
    } catch (err) {
        next(err);
    }
};

// 获取任务进度
exports.getTaskProgress = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 获取任务信息
        const [tasks] = await pool.query('SELECT * FROM daily_tasks WHERE id = ? ', [id]);

        if (tasks.length === 0) {
            return error(res, '任务不存在', 404);
        }

        const task = tasks[0];

        // 非周期任务不计算进度
        if (!task.is_longterm) {
            return error(res, '单日任务不支持进度统计', 400);
        }

        // 计算总天数
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // 统计排除天数和完成天数
        const [logs] = await pool.query(
            'SELECT SUM(is_excluded) AS excluded_days, SUM(is_completed) AS completed_days FROM daily_task_logs WHERE task_id = ?',
            [id]
        );

        const excludedDays = logs[0].excluded_days || 0;
        const completedDays = logs[0].completed_days || 0;
        const effectiveDays = totalDays - excludedDays;
        const progress = effectiveDays > 0 ? (completedDays / effectiveDays * 100).toFixed(1) : 0;

        success(res, {
            total_days: totalDays,
            excluded_days: excludedDays,
            effective_days: effectiveDays,
            completed_days: completedDays,
            progress: parseFloat(progress)
        });
    } catch (err) {
        next(err);
    }
};