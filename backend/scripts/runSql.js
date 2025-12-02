const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSql(sqlFile) {
    const sqlPath = path.join(__dirname, '..', 'sql', sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));
    
    for (const stmt of statements) {
        try {
            await pool.query(stmt);
            console.log('✅', stmt.substring(0, 60) + '...');
        } catch (err) {
            console.error('❌', err.message);
        }
    }
    
    process.exit(0);
}

const file = process.argv[2] || 'fix_daily_tasks.sql';
runSql(file);
