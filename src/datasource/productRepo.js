const { pool } = require('./db');

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getProductById(id) {
  // Optional: to make cache hits very obvious during demo
  const lag = Number(process.env.SIMULATE_DB_LATENCY_MS || 0);
  if (lag > 0) await sleep(lag);

  const [rows] = await pool.query(
    'SELECT id, name, price FROM products WHERE id = ? LIMIT 1',
    [id]
  );

  if (!rows || rows.length === 0) return null;
  const p = rows[0];
  return {
    id: String(p.id),
    name: p.name,
    price: Number(p.price),
    fetchedAt: new Date().toISOString()
  };
}

async function updateProductPrice(id, newPrice) {
  const [result] = await pool.execute(
    'UPDATE products SET price = ? WHERE id = ?',
    [newPrice, id]
  );

  if (!result || result.affectedRows === 0) return null;
  return getProductById(id);
}

module.exports = { getProductById, updateProductPrice };
