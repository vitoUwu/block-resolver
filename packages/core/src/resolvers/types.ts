import type { JsonLike } from "../utils/types";

export type ResolverType = string;

export type ResolverId<
  TAppName extends string = string,
  TResolverType extends string = string,
  TIdentifier extends string = string,
> = `${TAppName}/${TResolverType}/${TIdentifier}` | (string & {});

export type ResolverContext = object;
export type EmptyContext = Record<never, never>;

export type Resolver<TContext extends ResolverContext = EmptyContext> = {
  type: ResolverType;
  id: ResolverId;
  resolve: (
    props: Record<string, unknown>,
    ctx: TContext,
  ) => Promise<JsonLike | Response> | JsonLike | Response;
};

export type Resolvers<TContext extends ResolverContext = EmptyContext> = Map<
  ResolverType,
  Map<ResolverId, Resolver<TContext>>
>;

export type ResolverConstructor<
  TContext extends ResolverContext = EmptyContext,
> = new (id: ResolverId, module: any) => Resolver<TContext>;

export type ResolverClass<TContext extends ResolverContext = EmptyContext> =
  ResolverConstructor<TContext> & { type: ResolverType };
