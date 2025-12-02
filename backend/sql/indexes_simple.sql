-- ========================================
-- 性能优化索引脚本
-- 在 MySQL Workbench 中直接执行
-- 数据库: lusiatry_test_db
-- ========================================

USE lusiatry_test_db;

-- 任务表 (如果索引已存在会报错，忽略即可)
ALTER TABLE daily_tasks ADD INDEX idx_daily_tasks_dates (start_date, end_date);
ALTER TABLE daily_tasks ADD INDEX idx_daily_tasks_subject (subject);

-- 问题表
ALTER TABLE problems ADD INDEX idx_problems_is_solved (is_solved);
ALTER TABLE problems ADD INDEX idx_problems_subject (subject);
ALTER TABLE problems ADD INDEX idx_problems_date (date);

-- 学习时间表
ALTER TABLE study_time_logs ADD INDEX idx_study_time_date_subject (log_date, subject);

-- 文件树表
ALTER TABLE file_tree ADD INDEX idx_file_tree_parent (parent_id);
ALTER TABLE file_tree ADD INDEX idx_file_tree_type (type);
ALTER TABLE file_tree ADD INDEX idx_file_tree_is_subject (is_subject);

-- 课程表
ALTER TABLE courses ADD INDEX idx_courses_subject (subject);

-- 任务日志表
ALTER TABLE daily_task_logs ADD INDEX idx_task_logs_date (log_date);

-- 草稿表
ALTER TABLE drafts ADD INDEX idx_drafts_status (status);
ALTER TABLE drafts ADD INDEX idx_drafts_subject (subject);
