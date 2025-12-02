-- ========================================
-- 学习时长统计功能升级
-- ========================================

-- 1. 给 daily_tasks 表添加 duration 字段（任务预计时长，单位分钟）
ALTER TABLE daily_tasks ADD COLUMN duration INT DEFAULT 0 COMMENT '任务时长(分钟)' AFTER ddl_time;

-- 2. 确保 study_time_logs 表有 note 字段
-- ALTER TABLE study_time_logs ADD COLUMN note VARCHAR(500) DEFAULT NULL COMMENT '备注' AFTER duration;

-- 3. 给 study_time_logs 添加 source 字段标记来源（task=任务完成, manual=手动记录）
ALTER TABLE study_time_logs ADD COLUMN source VARCHAR(20) DEFAULT 'manual' COMMENT '来源: task/manual' AFTER note;

-- 4. 给 study_time_logs 添加 task_id 字段关联任务
ALTER TABLE study_time_logs ADD COLUMN task_id INT DEFAULT NULL COMMENT '关联任务ID' AFTER source;
ALTER TABLE study_time_logs ADD CONSTRAINT fk_study_time_task FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE SET NULL;
