import type { JsonLike } from "../utils/types";
import type {
  Resolver,
  ResolverContext,
  ResolverId,
  ResolverType,
} from "./types";

type LoaderCacheType = "stale-while-revalidate" | "no-cache" | "no-store";

interface LoaderModule {
  default: (
    props: Record<string, unknown>,
    ctx: ResolverContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
  cache?: {
    type: LoaderCacheType;
    key: (props: Record<string, unknown>) => string;
    ttl?: number;
  };
}

export class LoaderResolver implements Resolver {
  public static type: ResolverType = "loaders";

  get type(): ResolverType {
    return LoaderResolver.type;
  }

  constructor(
    public id: ResolverId,
    public module: LoaderModule,
  ) {}

  public resolve(
    props: Record<string, unknown>,
    ctx: ResolverContext,
  ): Promise<JsonLike | Response> | JsonLike | Response {
    return this.module.default(props, ctx);
  }
}
