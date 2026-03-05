import type { JsonLike } from "../utils/types";
import type {
  EmptyContext,
  Resolver,
  ResolverContext,
  ResolverId,
  ResolverType,
} from "./types";

type LoaderCacheType = "stale-while-revalidate" | "no-cache" | "no-store";

interface LoaderModule<TContext extends ResolverContext = EmptyContext> {
  default: (
    props: Record<string, unknown>,
    ctx: TContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
  cache?: {
    type: LoaderCacheType;
    key: (props: Record<string, unknown>) => string;
    ttl?: number;
  };
}

export class LoaderResolver<TContext extends ResolverContext = EmptyContext>
  implements Resolver<TContext>
{
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
    return this.module.default(props, ctx);
  }
}
