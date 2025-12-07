/**
 * 密码哈希生成工具
 * 用于生成 bcrypt 哈希值，可用于更新数据库中的密码
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// bcrypt 配置
const SALT_ROUNDS = 10; // 与项目保持一致

/**
 * 生成密码哈希
 */
async function generatePasswordHash(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('生成哈希时出错:', error);
        return null;
    }
}

/**
 * 验证密码哈希
 */
async function verifyPassword(password, hash) {
    try {
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
    } catch (error) {
        console.error('验证密码时出错:', error);
        return false;
    }
}

/**
 * 交互式密码哈希生成
 */
async function interactiveHashGenerator() {
    console.log('=== Lusiatry 密码哈希生成工具 ===\n');

    rl.question('请输入要哈希的密码: ', async (password) => {
        if (!password) {
            console.log('密码不能为空！');
            rl.close();
            return;
        }

        console.log('正在生成哈希...');
        const hash = await generatePasswordHash(password);

        if (hash) {
            console.log('\n✅ 哈希生成成功:');
            console.log(`原密码: ${password}`);
            console.log(`哈希值: ${hash}`);
            console.log('\nSQL 更新语句:');
            console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);

            // 验证生成的哈希
            const isValid = await verifyPassword(password, hash);
            console.log(`\n🔍 验证结果: ${isValid ? '✅ 哈希正确' : '❌ 哈希错误'}`);
        } else {
            console.log('❌ 哈希生成失败');
        }

        rl.close();
    });
}

/**
 * 命令行参数模式
 */
async function commandLineMode() {
    const password = process.argv[2];

    if (!password) {
        console.log('用法: node password-hash.js <密码>');
        console.log('或直接运行: node password-hash.js (交互模式)');
        return;
    }

    const hash = await generatePasswordHash(password);
    if (hash) {
        console.log(hash);
    } else {
        process.exit(1);
    }
}

// 主程序
if (require.main === module) {
    if (process.argv.length > 2) {
        commandLineMode();
    } else {
        interactiveHashGenerator();
    }
}

module.exports = {
    generatePasswordHash,
    verifyPassword,
    SALT_ROUNDS
};