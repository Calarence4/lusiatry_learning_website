-- 为 study_time_logs 表添加 note 字段
ALTER TABLE study_time_logs ADD COLUMN note VARCHAR(500) DEFAULT NULL COMMENT '备注' AFTER duration;
