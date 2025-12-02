-- 修复 problems 表
-- 1. 先删除有问题的数据
DELETE FROM problems WHERE id IS NULL;

-- 2. 重新插入测试数据（id 会自动生成）
INSERT INTO problems (problem, subject, date, is_solved) VALUES 
('线性空间的秩怎么计算', 6, CURDATE(), 0);

SELECT * FROM problems;
