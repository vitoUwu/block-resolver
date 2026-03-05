import type { JsonLike } from "../utils/types";
import type { LoaderCacheStore } from "../cache/types";

export type ResolverType = string;

export type ResolverId<
  TAppName extends string = string,
  TResolverType extends string = string,
  TIdentifier extends string = string,
> = `${TAppName}/${TResolverType}/${TIdentifier}` | (string & {});

export type ResolverContext = object;
export type EmptyContext = Record<never, never>;
export type ResolverInvokeMap = Record<
  string,
  {
    props: Record<string, unknown>;
    return: unknown;
  }
>;

export type Resolver<TContext extends ResolverContext = EmptyContext> = {
  type: ResolverType;
  id: ResolverId;
  resolve: (
    props: Record<string, unknown>,
    ctx: TContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
};

export interface ResolverRuntimeContext<
  TInvokeMap extends ResolverInvokeMap = ResolverInvokeMap,
> {
  resolve: (
    resolverId: ResolverId,
    props?: Record<string, unknown>,
  ) => Promise<JsonLike | Response>;
  invoke: <TResolverId extends keyof TInvokeMap & ResolverId>(
    resolverId: TResolverId,
    props: TInvokeMap[TResolverId]["props"],
  ) => Promise<TInvokeMap[TResolverId]["return"]>;
  cache: LoaderCacheStore;
}

export type Resolvers<TContext extends ResolverContext = EmptyContext> = Map<
  ResolverType,
  Map<ResolverId, Resolver<TContext>>
>;

export type ResolverConstructor<
  TContext extends ResolverContext = EmptyContext,
> = new (id: ResolverId, module: any) => Resolver<TContext>;

export type ResolverClass<TContext extends ResolverContext = EmptyContext> =
  ResolverConstructor<TContext> & { type: ResolverType };
