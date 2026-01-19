const mysql = require('mysql2/promise');

// A single shared pool (Singleton-ish) for the whole app.
// Uses env vars so it works both locally and in Docker.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'cache_user',
  password: process.env.MYSQL_PASSWORD || 'cache_pass',
  database: process.env.MYSQL_DATABASE || 'cache_demo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function pingDb() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, pingDb };
