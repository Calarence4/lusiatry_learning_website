-- ========================================
-- 完整修复 problems 表
-- ========================================

-- 步骤1: 备份现有数据（可选）
-- CREATE TABLE problems_backup AS SELECT * FROM problems;

-- 步骤2: 删除现有的 problems 表
DROP TABLE IF EXISTS problems;

-- 步骤3: 重新创建 problems 表（确保结构正确）
CREATE TABLE problems (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    problem VARCHAR(500) NOT NULL COMMENT '问题标题',
    content LONGTEXT DEFAULT NULL COMMENT '问题详细内容',
    subject INT DEFAULT NULL COMMENT '关联学科',
    source VARCHAR(255) DEFAULT NULL COMMENT '问题来源',
    is_solved TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已解决',
    solution LONGTEXT DEFAULT NULL COMMENT '解决方案',
    date DATE NOT NULL COMMENT '记录日期',
    related_draft_id INT DEFAULT NULL COMMENT '关联草稿ID',
    related_note_id INT DEFAULT NULL COMMENT '关联笔记ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 步骤4: 插入测试数据
INSERT INTO problems (problem, subject, date, is_solved) VALUES 
('线性空间的秩怎么计算', 6, CURDATE(), 0);

-- 步骤5: 验证数据
SELECT * FROM problems;

-- 预期结果：
-- id = 1 (自动生成)
-- is_solved = 0 (不是 NULL)
