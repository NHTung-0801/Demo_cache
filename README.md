# Cache Demo (L1 Memory + L2 Redis + MySQL)

This demo shows a **2-layer cache**:
- **L1**: in-process memory cache (fastest)
- **L2**: Redis cache (shared)
- **Source of truth**: **MySQL** (real DB, not simulated)

## Run Redis + MySQL (Docker)

```bash
docker compose up -d
```

MySQL will auto-create the `cache_demo` database and the `products` table via `db/init.sql`.

## Run the Node server

```bash
cp .env.example .env
npm install
npm run dev
```

## Endpoints

- `GET /health` -> check Redis + MySQL
- `GET /products/:id` -> read product (cacheable)
- `PUT /products/:id/price` -> update price + invalidate cache

## Quick test

```bash
curl http://localhost:3000/health
curl http://localhost:3000/products/1
curl http://localhost:3000/products/1   # hit cache

curl -X PUT http://localhost:3000/products/1/price \
  -H "Content-Type: application/json" \
  -d '{"price":350000}'

curl http://localhost:3000/products/1
```
