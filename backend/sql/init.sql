-- ========================================
-- Lusiatry 学习网站数据库初始化脚本
-- 版本: 2.0
-- 更新日期: 2025-12-06
-- ========================================

-- 创建数据库 (如果不存在)
CREATE DATABASE IF NOT EXISTS lusiatry_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lusiatry_db;

-- ========================================
-- 1. 文件树表 (知识库目录结构)
-- ========================================
CREATE TABLE IF NOT EXISTS `file_tree` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `parent_id` INT DEFAULT NULL COMMENT '父节点ID，NULL表示根节点',
    `title` VARCHAR(255) NOT NULL COMMENT '文件/文件夹名称',
    `type` ENUM('folder', 'file') NOT NULL COMMENT '类型：folder-文件夹，file-文件',
    `is_subject` TINYINT(1) DEFAULT 0 COMMENT '是否为学科根目录：0-否，1-是（仅folder有效）',
    `allow_as_category` TINYINT(1) DEFAULT 1 COMMENT '是否允许作为分类选项：0-禁用（子文件夹也不可选），1-允许',
    `is_system` TINYINT(1) DEFAULT 0 COMMENT '是否是系统文件夹(如草稿箱)',
    `content` TEXT DEFAULT NULL COMMENT '文件内容（Markdown），仅type=file时有效',
    `sort_order` INT DEFAULT 0 COMMENT '排序顺序，数字越小越靠前',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_file_tree_parent` (`parent_id`),
    KEY `idx_file_tree_type` (`type`),
    KEY `idx_file_tree_is_subject` (`is_subject`),
    CONSTRAINT `file_tree_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `file_tree` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库目录结构表';

-- ========================================
-- 2. 草稿表
-- ========================================
CREATE TABLE IF NOT EXISTS `drafts` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL COMMENT '草稿标题',
    `content` TEXT DEFAULT NULL COMMENT '草稿内容（Markdown）',
    `subject` INT DEFAULT NULL COMMENT '关联的学科文件夹ID',
    `tags` JSON DEFAULT NULL COMMENT '标签数组',
    `status` ENUM('pending', 'archived', 'published') DEFAULT 'pending' COMMENT '状态：pending-待处理，archived-已归档，published-已发布',
    `source_problem_id` INT UNSIGNED DEFAULT NULL COMMENT '关联的问题ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_drafts_status` (`status`),
    KEY `idx_drafts_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记草稿表';

-- ========================================
-- 3. 已归档草稿标题表
-- ========================================
CREATE TABLE IF NOT EXISTS `archived_draft_titles` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `original_draft_id` INT NOT NULL COMMENT '原草稿ID',
    `title` VARCHAR(255) NOT NULL COMMENT '草稿标题',
    `subject` INT DEFAULT NULL COMMENT '关联学科ID',
    `tags` JSON DEFAULT NULL COMMENT '标签数组',
    `archived_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '归档时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='已归档草稿标题表';

-- ========================================
-- 4. 问题记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `problems` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `problem` VARCHAR(500) NOT NULL COMMENT '问题标题',
    `content` LONGTEXT DEFAULT NULL COMMENT '问题详细内容',
    `subject` INT DEFAULT NULL COMMENT '关联学科',
    `source` VARCHAR(255) DEFAULT NULL COMMENT '问题来源',
    `is_solved` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已解决',
    `solution` LONGTEXT DEFAULT NULL COMMENT '解决方案',
    `answer` LONGTEXT DEFAULT NULL COMMENT '问题答案',
    `date` DATE NOT NULL COMMENT '记录日期',
    `related_draft_id` INT DEFAULT NULL COMMENT '关联草稿ID',
    `related_note_id` INT DEFAULT NULL COMMENT '关联笔记ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `subject` (`subject`),
    CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`subject`) REFERENCES `file_tree` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问题记录表';

-- ========================================
-- 5. 课程表
-- ========================================
CREATE TABLE IF NOT EXISTS `courses` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) DEFAULT NULL COMMENT '课程名',
    `subject` INT DEFAULT NULL COMMENT '关联的学科文件夹ID',
    `course_url` VARCHAR(500) DEFAULT NULL COMMENT '课程链接',
    `notes_path` VARCHAR(500) DEFAULT NULL COMMENT '笔记路径',
    `start_date` DATE DEFAULT NULL COMMENT '开始日期',
    `end_date` DATE DEFAULT NULL COMMENT '结束日期',
    `total_lessons` INT UNSIGNED DEFAULT NULL COMMENT '总课时',
    `finished_lessons` INT UNSIGNED DEFAULT NULL COMMENT '已完成课时',
    `progress` DOUBLE(5,2) DEFAULT NULL COMMENT '进度百分比',
    `status` ENUM('not_started', 'in_progress', 'completed', 'paused') DEFAULT 'not_started' COMMENT '课程状态',
    `color` VARCHAR(20) DEFAULT NULL COMMENT '课程颜色',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_courses_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- ========================================
-- 6. 课程进度日志表
-- ========================================
CREATE TABLE IF NOT EXISTS `course_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `course_id` INT NOT NULL COMMENT '关联课程',
    `prev_lessons` INT NOT NULL DEFAULT 0 COMMENT '变更前课时',
    `new_lessons` INT NOT NULL DEFAULT 0 COMMENT '变更后课时',
    `note` TEXT DEFAULT NULL COMMENT '学习笔记/心得',
    `log_date` DATE NOT NULL COMMENT '记录日期',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `course_id` (`course_id`),
    CONSTRAINT `course_logs_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程进度日志表';

-- ========================================
-- 7. 每日任务表
-- ========================================
CREATE TABLE IF NOT EXISTS `daily_tasks` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL COMMENT '任务名称',
    `subject` VARCHAR(100) DEFAULT NULL COMMENT '学科名称',
    `start_date` DATE NOT NULL COMMENT '开始日期',
    `end_date` DATE NOT NULL COMMENT '结束日期',
    `ddl_time` TIME DEFAULT NULL COMMENT '每日截止时间',
    `duration` INT UNSIGNED DEFAULT NULL COMMENT '预期时长(分钟)',
    `is_longterm` TINYINT(1) DEFAULT 0 COMMENT '是否周期任务',
    `progress` DOUBLE(5,2) DEFAULT NULL COMMENT '进度',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_dates` (`start_date`, `end_date`),
    KEY `idx_subject` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日任务表';

-- ========================================
-- 8. 每日任务日志表 (打卡记录)
-- ========================================
CREATE TABLE IF NOT EXISTS `daily_task_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `task_id` INT UNSIGNED NOT NULL COMMENT '关联任务ID',
    `log_date` DATE NOT NULL COMMENT '打卡日期',
    `is_completed` TINYINT(1) DEFAULT 0 COMMENT '是否完成：0-未完成，1-已完成',
    `is_excluded` TINYINT(1) DEFAULT 0 COMMENT '是否排除：0-正常，1-从当日移除',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_task_date` (`task_id`, `log_date`) COMMENT '同一任务同一天只能有一条记录',
    KEY `idx_task_logs_date` (`log_date`),
    CONSTRAINT `daily_task_logs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `daily_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务每日打卡记录表';

-- ========================================
-- 9. 学习时间记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `study_time_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `log_date` DATE NOT NULL COMMENT '记录日期',
    `subject` VARCHAR(100) DEFAULT NULL COMMENT '学科名称',
    `duration` INT NOT NULL COMMENT '学习时长（分钟）',
    `note` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_study_time_date_subject` (`log_date`, `subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习时间记录表';

-- ========================================
-- 视图: 可选学科列表
-- ========================================
CREATE OR REPLACE VIEW `v_selectable_subjects` AS
WITH RECURSIVE `subject_tree` AS (
    -- 基础查询：获取所有学科根目录
    SELECT 
        `id`,
        `parent_id`,
        `title`,
        `is_subject`,
        `allow_as_category`,
        1 AS `level`,
        CAST(`title` AS CHAR(1000)) AS `path`,
        `allow_as_category` AS `inherited_allow`
    FROM `file_tree`
    WHERE `is_subject` = 1 AND `type` = 'folder'
    
    UNION ALL
    
    -- 递归查询：获取所有子文件夹
    SELECT 
        ft.`id`,
        ft.`parent_id`,
        ft.`title`,
        ft.`is_subject`,
        ft.`allow_as_category`,
        st.`level` + 1,
        CONCAT(st.`path`, ' > ', ft.`title`),
        CASE WHEN st.`inherited_allow` = 0 THEN 0 ELSE ft.`allow_as_category` END
    FROM `file_tree` ft
    INNER JOIN `subject_tree` st ON ft.`parent_id` = st.`id`
    WHERE ft.`type` = 'folder'
)
SELECT 
    `id`,
    `parent_id`,
    `title`,
    `level`,
    `path`,
    `inherited_allow` AS `selectable`
FROM `subject_tree`
WHERE `inherited_allow` = 1
ORDER BY `path`;

-- ========================================
-- 初始数据: 系统文件夹 (草稿箱)
-- ========================================
INSERT INTO `file_tree` (`title`, `type`, `parent_id`, `is_subject`, `is_system`, `allow_as_category`) 
VALUES ('草稿箱', 'folder', NULL, 0, 1, 0)
ON DUPLICATE KEY UPDATE `title` = `title`;

-- ========================================
-- 说明
-- ========================================
-- 表结构说明：
-- 1. file_tree: 知识库的核心表，存储文件夹和文件的树形结构
-- 2. drafts: 草稿表，用于临时保存未完成的笔记
-- 3. archived_draft_titles: 已归档草稿的标题记录
-- 4. problems: 问题记录表，记录学习中遇到的问题
-- 5. courses: 课程表，管理学习课程
-- 6. course_logs: 课程进度日志，记录每次学习进度更新
-- 7. daily_tasks: 每日任务表，用于打卡计划
-- 8. daily_task_logs: 任务打卡记录
-- 9. study_time_logs: 学习时间统计
--
-- 视图说明：
-- v_selectable_subjects: 返回所有可作为分类选项的学科文件夹
