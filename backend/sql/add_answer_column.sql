-- 为 problems 表添加 answer 字段（答案与解决思路分开）
ALTER TABLE problems ADD COLUMN answer LONGTEXT DEFAULT NULL COMMENT '问题答案' AFTER solution;
