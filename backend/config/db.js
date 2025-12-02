const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lusiatry_test_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 解决 BigInt 序列化问题
    supportBigNumbers: true,
    bigNumberStrings: false,
    // 将 TINYINT(1) 转为布尔值
    typeCast: function (field, next) {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1';
        }
        return next();
    }
});

// 测试连接
pool.getConnection()
    .then(connection => {
        console.log('✅ 数据库连接成功');
        connection.release();
    })
    .catch(err => {
        console.error('❌ 数据库连接失败:', err.message);
    });

module.exports = pool;