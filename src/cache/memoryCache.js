class MemoryCache {
  constructor({ defaultTtlMs = 10_000, maxKeys = 500 } = {}) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxKeys = maxKeys;
    this.map = new Map(); // key -> { value, expiresAt }
  }

  _now() {
    return Date.now();
  }

  _isExpired(entry) {
    return entry.expiresAt !== null && entry.expiresAt <= this._now();
  }

  _touch(key, entry) {
    // Đưa key lên cuối Map để thể hiện "mới dùng gần đây"
    this.map.delete(key);
    this.map.set(key, entry);
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (this._isExpired(entry)) {
      this.map.delete(key);
      return null;
    }

    this._touch(key, entry);
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = ttlMs === null ? null : this._now() + ttlMs;

    const entry = { value, expiresAt };
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, entry);

    // LRU eviction
    while (this.map.size > this.maxKeys) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
  }

  del(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }

  size() {
    return this.map.size;
  }
}

module.exports = { MemoryCache };