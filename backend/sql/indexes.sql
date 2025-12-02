-- ========================================
-- 性能优化索引脚本
-- MySQL 兼容版本
-- ========================================

-- 使用存储过程安全创建索引（如果不存在）
DELIMITER //

DROP PROCEDURE IF EXISTS create_index_if_not_exists//

CREATE PROCEDURE create_index_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(256)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND index_name = p_index;
    
    IF index_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('Created index: ', p_index) AS result;
    ELSE
        SELECT CONCAT('Index already exists: ', p_index) AS result;
    END IF;
END//

DELIMITER ;

-- 任务表：按日期范围查询优化
CALL create_index_if_not_exists('daily_tasks', 'idx_daily_tasks_dates', 'start_date, end_date');
CALL create_index_if_not_exists('daily_tasks', 'idx_daily_tasks_subject', 'subject');

-- 问题表：按状态筛选优化
CALL create_index_if_not_exists('problems', 'idx_problems_is_solved', 'is_solved');
CALL create_index_if_not_exists('problems', 'idx_problems_subject', 'subject');
CALL create_index_if_not_exists('problems', 'idx_problems_date', 'date');

-- 学习时间表：按日期和科目统计优化
CALL create_index_if_not_exists('study_time_logs', 'idx_study_time_date_subject', 'log_date, subject');

-- 文件树表：按父节点查询子节点优化
CALL create_index_if_not_exists('file_tree', 'idx_file_tree_parent', 'parent_id');
CALL create_index_if_not_exists('file_tree', 'idx_file_tree_type', 'type');
CALL create_index_if_not_exists('file_tree', 'idx_file_tree_is_subject', 'is_subject');

-- 课程表：按科目筛选优化
CALL create_index_if_not_exists('courses', 'idx_courses_subject', 'subject');

-- 任务日志表：按日期查询优化
CALL create_index_if_not_exists('daily_task_logs', 'idx_task_logs_date', 'log_date');

-- 草稿表：按状态筛选优化
CALL create_index_if_not_exists('drafts', 'idx_drafts_status', 'status');
CALL create_index_if_not_exists('drafts', 'idx_drafts_subject', 'subject');

-- 清理存储过程
DROP PROCEDURE IF EXISTS create_index_if_not_exists;

SELECT '索引创建完成！' AS status;
