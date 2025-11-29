/**
 * 统一成功响应
 */
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        data,
        message
    });
};

/**
 * 统一错误响应
 */
const error = (res, message = '操作失败', statusCode = 500, err = null) => {
    const response = {
        success: false,
        data: null,
        message
    };

    // 开发环境显示详细错误
    if (process.env.NODE_ENV === 'development' && err) {
        response.error = err.message || err;
    }

    res.status(statusCode).json(response);
};

module.exports = { success, error };