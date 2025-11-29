const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error('错误:', err);

    // 数据库错误
    if (err.code === 'ER_DUP_ENTRY') {
        return error(res, '数据已存在', 400, err);
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return error(res, '关联数据不存在', 400, err);
    }

    // 默认服务器错误
    error(res, '服务器内部错误', 500, err);
};

module.exports = errorHandler;