import type { LoaderCacheConfig } from "../cache/types";
import type { JsonLike } from "../utils/types";
import type {
  EmptyContext,
  Resolver,
  ResolverContext,
  ResolverId,
  ResolverRuntimeContext,
  ResolverType,
} from "./types";

function debugCache(
  resolverId: ResolverId,
  key: string,
  event: "HIT" | "MISS" | "STALE-HIT" | "REVALIDATED" | "BYPASS",
) {
  console.info(`[cache:${event}] resolver=${resolverId} key=${key}`);
}

interface LoaderModule<TContext extends ResolverContext = EmptyContext> {
  default: (
    props: Record<string, unknown>,
    ctx: TContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
  cache?: LoaderCacheConfig;
}

function getCacheStore<TContext extends ResolverContext>(
  ctx: TContext,
): ResolverRuntimeContext["cache"] {
  const runtimeCtx = ctx as Partial<ResolverRuntimeContext>;
  if (!runtimeCtx.cache) {
    throw new Error(
      "Missing runtime cache store in resolver context. Use State.resolve(...) to execute resolvers.",
    );
  }
  return runtimeCtx.cache;
}

export class LoaderResolver<
  TContext extends ResolverContext = EmptyContext,
> implements Resolver<TContext> {
  public static type: ResolverType = "loaders";

  get type(): ResolverType {
    return LoaderResolver.type;
  }

  constructor(
    public id: ResolverId,
    public module: LoaderModule<TContext>,
  ) {}

  public resolve(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> | JsonLike | Response {
    return this.resolveWithCache(props, ctx);
  }

  private async resolveWithCache(
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<JsonLike | Response> {
    const cacheStore = getCacheStore(ctx);
    const cacheConfig = this.module.cache;
    if (!cacheConfig || cacheConfig.type === "no-store") {
      const key = cacheConfig
        ? `${this.id}:${cacheConfig.key(props)}`
        : this.id;
      debugCache(this.id, key, "BYPASS");
      return await this.module.default(props, ctx);
    }

    const cacheKey = `${this.id}:${cacheConfig.key(props)}`;
    const cached = await cacheStore.read(cacheKey);
    const isFresh =
      typeof cached?.expiresAt !== "number" || cached.expiresAt > Date.now();

    if (cached && isFresh) {
      debugCache(this.id, cacheKey, "HIT");
      return cached.value;
    }

    if (cached && cacheConfig.type === "stale-while-revalidate") {
      debugCache(this.id, cacheKey, "STALE-HIT");
      void this.revalidate(cacheKey, cacheConfig, props, ctx);
      return cached.value;
    }

    debugCache(this.id, cacheKey, "MISS");
    const resolved = await this.module.default(props, ctx);
    if (!(resolved instanceof Response)) {
      await cacheStore.write(cacheKey, resolved, cacheConfig.ttl);
    }

    return resolved;
  }

  private async revalidate(
    cacheKey: string,
    cacheConfig: LoaderCacheConfig,
    props: Record<string, unknown>,
    ctx: TContext,
  ): Promise<void> {
    const cacheStore = getCacheStore(ctx);
    try {
      const refreshed = await this.module.default(props, ctx);
      if (refreshed instanceof Response) {
        await cacheStore.delete(cacheKey);
        return;
      }
      await cacheStore.write(cacheKey, refreshed, cacheConfig.ttl);
      debugCache(this.id, cacheKey, "REVALIDATED");
    } catch {
      // Revalidation errors should not affect in-flight responses.
    }
  }
}
