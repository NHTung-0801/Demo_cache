const Redis = require("ioredis");

class RedisCache {
  constructor({ host = "127.0.0.1", port = 6379, prefix = "cache-demo:" } = {}) {
    this.redis = new Redis({ host, port });
    this.prefix = prefix;
  }

  _k(key) {
    return `${this.prefix}${key}`;
  }

  async get(key) {
    const raw = await this.redis.get(this._k(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key, value, ttlSeconds = 30) {
    const raw = JSON.stringify(value);
    // EX = expire seconds
    await this.redis.set(this._k(key), raw, "EX", ttlSeconds);
  }

  async del(key) {
    await this.redis.del(this._k(key));
  }

  async ping() {
    return this.redis.ping();
  }
}

module.exports = { RedisCache };
