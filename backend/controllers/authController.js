const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { success, error } = require('../utils/response');

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'lusiatry-dev-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES = '24h'; // 24小时有效期

/**
 * 生成 Access Token (JWT)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            sub: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
};

/**
 * 管理员登录
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('登录请求:', { username, password: password ? '***' : 'empty' });

        // 参数验证
        if (!username || !password) {
            return error(res, '用户名和密码不能为空', 400);
        }

        // 查找用户
        const [users] = await pool.query(
            'SELECT id, username, password_hash, role, is_active FROM users WHERE username = ?',
            [username]
        );
        console.log('查询结果:', users.length, '条记录');

        if (users.length === 0) {
            return error(res, '用户名或密码错误', 401);
        }

        const user = users[0];
        console.log('用户信息:', { id: user.id, username: user.username, is_active: user.is_active });

        // 检查用户是否被禁用
        if (!user.is_active) {
            return error(res, '账号已被禁用', 401);
        }

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('密码验证结果:', validPassword);

        if (!validPassword) {
            return error(res, '用户名或密码错误', 401);
        }

        // 生成 token
        const accessToken = generateAccessToken(user);

        success(res, {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        }, '登录成功');

    } catch (err) {
        console.error('登录失败:', err);
        error(res, '登录失败', 500, err);
    }
};

/**
 * 获取当前用户信息
 */
const me = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return error(res, '用户不存在', 404);
        }

        success(res, users[0]);

    } catch (err) {
        console.error('获取用户信息失败:', err);
        error(res, '获取用户信息失败', 500, err);
    }
};

module.exports = {
    login,
    me
};