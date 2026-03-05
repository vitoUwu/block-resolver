import type { JsonLike } from "../utils/types";
import type { CacheRecord, LoaderCacheStore } from "./types";

const memoryCache = new Map<string, CacheRecord>();

export class InMemoryCacheStore implements LoaderCacheStore {
  private defaultTtl?: number;

  constructor(options: { defaultTtl?: number } = {}) {
    this.defaultTtl = options.defaultTtl;
  }

  public async read(key: string): Promise<CacheRecord | undefined> {
    return memoryCache.get(key);
  }

  public async write(
    key: string,
    value: JsonLike,
    ttl?: number,
  ): Promise<void> {
    const expiresAt =
      typeof ttl === "number"
        ? Date.now() + ttl
        : this.defaultTtl
          ? Date.now() + this.defaultTtl
          : undefined;
    memoryCache.set(key, { value, expiresAt });
  }

  public async delete(key: string): Promise<void> {
    memoryCache.delete(key);
  }
}
