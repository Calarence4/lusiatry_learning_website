-- 修复 daily_tasks 表结构

-- 创建 daily_tasks 表（保持 title 和 varchar 类型的 subject）
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL COMMENT '任务名称',
    subject VARCHAR(100) NULL COMMENT '学科名称',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    ddl_time TIME NULL COMMENT '每日截止时间',
    duration INT UNSIGNED NULL COMMENT '预期时长(分钟)',
    is_longterm TINYINT(1) DEFAULT 0 COMMENT '是否周期任务',
    progress DOUBLE(5,2) NULL COMMENT '进度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日任务表';

-- 创建任务日志表（记录每天的完成状态）
CREATE TABLE IF NOT EXISTS daily_task_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id INT UNSIGNED NOT NULL COMMENT '任务ID',
    log_date DATE NOT NULL COMMENT '日期',
    is_completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
    is_excluded TINYINT(1) DEFAULT 0 COMMENT '是否排除',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_task_date (task_id, log_date),
    INDEX idx_date (log_date),
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务完成日志表';
