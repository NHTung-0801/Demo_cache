const express = require("express");
const { MemoryCache } = require("./cache/memoryCache");
const { RedisCache } = require("./cache/redisCache");
const { CacheService } = require("./cache/cacheService");
const { getProductById, updateProductPrice } = require("./datasource/productRepo");
const { pingDb } = require("./datasource/db");

const app = express();
app.use(express.json());

const memoryCache = new MemoryCache({ defaultTtlMs: 5_000, maxKeys: 1000 });
const redisCache = new RedisCache({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  prefix: process.env.REDIS_PREFIX || "demo:"
});

const cache = new CacheService({
  memoryCache,
  redisCache,
  l1TtlMs: 5_000,      
  l2TtlSeconds: 30     
});

app.get("/health", async (req, res) => {
  const pong = await redisCache.ping();
  const mysqlOk = await pingDb();
  res.json({ ok: true, redis: pong, mysql: mysqlOk });
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  const key = `product:${id}`;

  const started = Date.now();
  const result = await cache.getOrSet(key, async () => {
    const data = await getProductById(id);
    return data; 
  });
  const elapsedMs = Date.now() - started;

  if (result.value === null) {
    return res.status(404).json({
      message: "Not found",
      cache: result.hit,
      elapsedMs
    });
  }

  res.json({
    data: result.value,
    cache: result.hit,
    elapsedMs
  });
});

app.put("/products/:id/price", async (req, res) => {
  const id = req.params.id;
  const { price } = req.body;

  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ message: "price must be a positive number" });
  }

  const updated = await updateProductPrice(id, price);
  if (!updated) return res.status(404).json({ message: "Not found" });

  await cache.invalidate(`product:${id}`);

  res.json({ message: "Updated + cache invalidated", updated });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Try: GET /products/1 multiple times to see cache hit/miss");
});
