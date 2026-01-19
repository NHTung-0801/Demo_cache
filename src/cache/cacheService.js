class CacheService {
  constructor({ memoryCache, redisCache, l1TtlMs = 5_000, l2TtlSeconds = 30 } = {}) {
    this.memory = memoryCache;
    this.redis = redisCache;
    this.l1TtlMs = l1TtlMs;
    this.l2TtlSeconds = l2TtlSeconds;
    this.inFlight = new Map();
  }

  async getOrSet(key, fetcher) {
    const l1 = this.memory.get(key);
    if (l1 !== null) {
      return { value: l1, hit: "L1(memory)" };
    }
    const l2 = await this.redis.get(key);
    if (l2 !== null) {
      this.memory.set(key, l2, this.l1TtlMs);
      return { value: l2, hit: "L2(redis)" };
    }

    if (this.inFlight.has(key)) {
      const v = await this.inFlight.get(key);
      return { value: v, hit: "COALESCED(waited)" };
    }

    const p = (async () => {
      const fresh = await fetcher();
      await this.redis.set(key, fresh, this.l2TtlSeconds);

      this.memory.set(key, fresh, this.l1TtlMs);

      return fresh;
    })();

    this.inFlight.set(key, p);

    try {
      const v = await p;
      return { value: v, hit: "MISS(datasource)" };
    } finally {
      this.inFlight.delete(key);
    }
  }

  async invalidate(key) {
    this.memory.del(key);
    await this.redis.del(key);
  }
}

module.exports = { CacheService };
