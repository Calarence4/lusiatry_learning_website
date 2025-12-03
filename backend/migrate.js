const pool = require('./config/db');

async function migrate() {
    try {
        // 检查 status 字段是否存在
        console.log('检查 status 字段...');
        const [columns] = await pool.query('SHOW COLUMNS FROM courses LIKE "status"');
        
        if (columns.length === 0) {
            console.log('添加 status 字段...');
            await pool.query(`
                ALTER TABLE courses 
                ADD COLUMN status ENUM('not_started', 'in_progress', 'completed', 'paused') 
                DEFAULT 'not_started' 
                COMMENT '课程状态'
            `);
            console.log('status 字段添加成功');
        } else {
            console.log('status 字段已存在');
        }

        // 创建 course_logs 表
        console.log('创建 course_logs 表...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                course_id INT NOT NULL COMMENT '关联课程',
                prev_lessons INT NOT NULL DEFAULT 0 COMMENT '变更前课时',
                new_lessons INT NOT NULL DEFAULT 0 COMMENT '变更后课时',
                note TEXT DEFAULT NULL COMMENT '学习笔记/心得',
                log_date DATE NOT NULL COMMENT '记录日期',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('course_logs 表创建成功');

        // 更新现有课程的 status
        console.log('更新现有课程状态...');
        await pool.query(`
            UPDATE courses 
            SET status = CASE 
                WHEN finished_lessons = 0 THEN 'not_started'
                WHEN finished_lessons >= total_lessons THEN 'completed'
                ELSE 'in_progress'
            END
            WHERE status IS NULL OR status = 'not_started'
        `);
        console.log('状态更新成功');

        console.log('迁移完成！');
    } catch (err) {
        console.error('迁移失败:', err);
    } finally {
        process.exit();
    }
}

migrate();
