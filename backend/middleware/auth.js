const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'lusiatry-dev-secret-change-in-production';

/**
 * JWT 验证中间件
 * 从 Authorization header 中提取并验证 token
 */
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return error(res, '未提供认证令牌', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.sub,
                username: decoded.username,
                role: decoded.role
            };
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return error(res, '令牌已过期', 401);
            }
            return error(res, '无效的认证令牌', 401);
        }
    } catch (err) {
        return error(res, '认证失败', 500, err);
    }
};

module.exports = {
    requireAuth,
    JWT_SECRET
};