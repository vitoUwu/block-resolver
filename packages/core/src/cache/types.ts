import type { JsonLike } from "../utils/types";

export type LoaderCacheType =
  | "stale-while-revalidate"
  | "no-cache"
  | "no-store";

export interface LoaderCacheConfig<
  TProps extends Record<string, any> = Record<string, any>,
> {
  type: LoaderCacheType;
  key: (props: TProps) => string;
  ttl?: number;
}

export interface CacheRecord {
  value: JsonLike;
  expiresAt?: number;
}

export interface LoaderCacheStore {
  read: (key: string) => Promise<CacheRecord | undefined>;
  write: (key: string, value: JsonLike, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}
