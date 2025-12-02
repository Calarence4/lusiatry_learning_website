-- 修复 problems 表结构
-- 如果 id 列不是 AUTO_INCREMENT，需要修复

-- 首先备份数据
CREATE TABLE IF NOT EXISTS problems_backup AS SELECT * FROM problems;

-- 检查并修复 id 列
ALTER TABLE problems MODIFY COLUMN id INT PRIMARY KEY AUTO_INCREMENT;

-- 如果 is_solved 列为 NULL，设置默认值
UPDATE problems SET is_solved = 0 WHERE is_solved IS NULL;

-- 为现有记录设置 id（如果为 NULL）
-- 需要先删除主键约束，更新数据，再添加回来
-- 这是一个较复杂的操作，建议手动执行

-- 简单修复：如果记录没有id，可能需要重新插入
-- 或者检查表结构是否正确

-- 显示当前表结构
DESCRIBE problems;

-- 显示当前数据
SELECT * FROM problems;
