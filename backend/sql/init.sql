-- ========================================
-- Lusiatry 学习网站数据库初始化脚本
-- ========================================

-- 创建数据库 (如果不存在)
CREATE DATABASE IF NOT EXISTS lusiatry_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lusiatry_learning;

-- ========================================
-- 文件树表 (知识库)
-- ========================================
CREATE TABLE IF NOT EXISTS file_tree (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    type ENUM('folder', 'file') NOT NULL,
    parent_id INT DEFAULT NULL,
    is_subject TINYINT(1) DEFAULT 0 COMMENT '是否是学科/可选分类',
    is_system TINYINT(1) DEFAULT 0 COMMENT '是否是系统文件夹(如草稿箱)',
    content LONGTEXT DEFAULT NULL COMMENT 'markdown 内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES file_tree(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 可选学科视图 (用于下拉选择)
CREATE OR REPLACE VIEW v_selectable_subjects AS
WITH RECURSIVE subject_path AS (
    SELECT 
        id,
        title,
        parent_id,
        title AS path
    FROM file_tree
    WHERE parent_id IS NULL AND is_subject = 1
    
    UNION ALL
    
    SELECT 
        f.id,
        f.title,
        f.parent_id,
        CONCAT(sp.path, ' / ', f.title) AS path
    FROM file_tree f
    INNER JOIN subject_path sp ON f.parent_id = sp.id
    WHERE f.is_subject = 1
)
SELECT id, title, path FROM subject_path;

-- ========================================
-- 草稿表
-- ========================================
CREATE TABLE IF NOT EXISTS drafts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT DEFAULT NULL,
    subject INT DEFAULT NULL COMMENT '关联学科',
    tags JSON DEFAULT NULL COMMENT '标签',
    status ENUM('draft', 'review', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 问题记录表
-- ========================================
CREATE TABLE IF NOT EXISTS problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    problem VARCHAR(500) NOT NULL COMMENT '问题标题',
    content LONGTEXT DEFAULT NULL COMMENT '问题详细内容',
    subject INT DEFAULT NULL COMMENT '关联学科',
    source VARCHAR(255) DEFAULT NULL COMMENT '问题来源',
    is_solved TINYINT(1) DEFAULT 0 COMMENT '是否已解决',
    solution LONGTEXT DEFAULT NULL COMMENT '解决方案',
    date DATE NOT NULL COMMENT '记录日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 课程表
-- ========================================
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT '课程名称',
    subject INT DEFAULT NULL COMMENT '关联学科',
    course_url VARCHAR(500) DEFAULT NULL COMMENT '课程链接',
    notes_path VARCHAR(500) DEFAULT NULL COMMENT '笔记路径',
    start_date DATE DEFAULT NULL COMMENT '开始日期',
    end_date DATE DEFAULT NULL COMMENT '预计完成日期',
    total_lessons INT NOT NULL DEFAULT 1 COMMENT '总课时',
    finished_lessons INT NOT NULL DEFAULT 0 COMMENT '已完成课时',
    process DECIMAL(5,2) DEFAULT 0.00 COMMENT '进度百分比(冗余字段)',
    status ENUM('not_started', 'in_progress', 'completed', 'paused') DEFAULT 'not_started' COMMENT '课程状态',
    color VARCHAR(20) DEFAULT NULL COMMENT '课程颜色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 课程进度日志表 (仿 Bangumi)
-- ========================================
CREATE TABLE IF NOT EXISTS course_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL COMMENT '关联课程',
    prev_lessons INT NOT NULL DEFAULT 0 COMMENT '变更前课时',
    new_lessons INT NOT NULL DEFAULT 0 COMMENT '变更后课时',
    note TEXT DEFAULT NULL COMMENT '学习笔记/心得',
    log_date DATE NOT NULL COMMENT '记录日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 每日任务表
-- ========================================
CREATE TABLE IF NOT EXISTS daily_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '任务名称',
    subject INT DEFAULT NULL COMMENT '关联学科',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    ddl_time TIME DEFAULT NULL COMMENT '截止时间',
    is_longterm TINYINT(1) DEFAULT 0 COMMENT '是否是长期任务',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 每日任务日志表 (记录完成状态)
-- ========================================
CREATE TABLE IF NOT EXISTS daily_task_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    log_date DATE NOT NULL,
    is_completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
    is_excluded TINYINT(1) DEFAULT 0 COMMENT '是否排除(今日不做)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_task_date (task_id, log_date),
    FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 学习时间记录表
-- ========================================
CREATE TABLE IF NOT EXISTS study_time_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    log_date DATE NOT NULL COMMENT '记录日期',
    subject INT DEFAULT NULL COMMENT '关联学科',
    duration INT NOT NULL COMMENT '学习时长(分钟)',
    note VARCHAR(500) DEFAULT NULL COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject) REFERENCES file_tree(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 初始数据: 系统文件夹
-- ========================================
INSERT INTO file_tree (title, type, parent_id, is_subject, is_system) VALUES 
    ('草稿箱', 'folder', NULL, 0, 1)
ON DUPLICATE KEY UPDATE title = title;

-- ========================================
-- 示例数据: 学科分类 (可选)
-- ========================================
-- INSERT INTO file_tree (title, type, parent_id, is_subject, is_system) VALUES 
--     ('数学', 'folder', NULL, 1, 0),
--     ('物理', 'folder', NULL, 1, 0),
--     ('计算机科学', 'folder', NULL, 1, 0);
